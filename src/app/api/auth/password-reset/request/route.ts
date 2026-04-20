import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema/auth';
import { getClientIp } from '@/lib/auth/get-ip';
import { hashEmailForKey } from '@/lib/auth/login-lockout';
import {
  generateResetToken,
  hashResetToken,
  resetTokenExpiry,
} from '@/lib/auth/password-reset';
import { passwordResetRequestSchema } from '@/lib/auth/schemas';
import { sendPasswordResetEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/audit/log';
import { checkRateLimit } from '@/lib/rate-limit';
import { PASSWORD_RESET_REQUEST_LIMIT } from '@/lib/rate-limit-configs';

const GENERIC_OK = { success: true } as const;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipRl = await checkRateLimit(
    `pw-reset-request:ip:${ip}`,
    PASSWORD_RESET_REQUEST_LIMIT,
  );
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: 'Too many reset requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(ipRl.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = passwordResetRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(GENERIC_OK);
  }

  const email = parsed.data.email.toLowerCase().trim();
  const emailHash = hashEmailForKey(email);

  const emailRl = await checkRateLimit(
    `pw-reset-request:email:${emailHash}`,
    PASSWORD_RESET_REQUEST_LIMIT,
  );
  if (!emailRl.allowed) {
    return NextResponse.json(GENERIC_OK);
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, email: true, hashedPassword: true },
    });

    if (user?.hashedPassword) {
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = resetTokenExpiry();

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      try {
        await sendPasswordResetEmail(user.email, rawToken);
      } catch (err) {
        console.error('Failed to send password reset email', err);
      }
    }

    await logAuditEvent({
      action: 'password_reset_requested',
      userId: user?.id ?? null,
      request,
      metadata: { emailHash, accountFound: !!user?.hashedPassword },
    });
  } catch (err) {
    console.error('Password reset request failed', err);
  }

  return NextResponse.json(GENERIC_OK);
}
