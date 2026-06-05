import { type NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { emailVerificationTokens, users } from '@/db/schema/auth';
import {
  hashVerificationToken,
  isVerificationTokenExpired,
} from '@/lib/auth/email-verification';
import { getClientIp } from '@/lib/auth/get-ip';
import { verifyEmailSchema } from '@/lib/auth/schemas';
import { logAuditEvent } from '@/lib/audit/log';
import { sendWelcomeEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { EMAIL_VERIFY_CONFIRM_LIMIT } from '@/lib/rate-limit-configs';

const INVALID = { error: 'Invalid or expired verification link.' } as const;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`email-verify:ip:${ip}`, EMAIL_VERIFY_CONFIRM_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(INVALID, { status: 400 });
  }

  const tokenHash = hashVerificationToken(parsed.data.token);
  const record = await db.query.emailVerificationTokens.findFirst({
    where: eq(emailVerificationTokens.token, tokenHash),
  });

  if (!record || record.usedAt || isVerificationTokenExpired(record.expiresAt)) {
    return NextResponse.json(INVALID, { status: 400 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, record.userId),
    columns: { id: true, email: true, emailVerified: true, emailPreferences: true },
  });
  if (!user) {
    return NextResponse.json(INVALID, { status: 400 });
  }

  const alreadyVerified = !!user.emailVerified;
  const now = new Date();

  await db.transaction(async (tx) => {
    if (!alreadyVerified) {
      await tx
        .update(users)
        .set({ emailVerified: now })
        .where(eq(users.id, record.userId));
    }
    // Consume this token and any other outstanding tokens for the user.
    await tx
      .update(emailVerificationTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(emailVerificationTokens.userId, record.userId),
          isNull(emailVerificationTokens.usedAt),
        ),
      );
  });

  if (!alreadyVerified) {
    await logAuditEvent({ action: 'email_verified', userId: record.userId, request });
    if (user.emailPreferences?.product) {
      try {
        await sendWelcomeEmail(user.email);
      } catch (err) {
        console.error('Failed to send welcome email', err);
      }
    }
  }

  return NextResponse.json({ success: true });
}
