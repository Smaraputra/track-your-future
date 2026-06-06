import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { emailVerificationTokens, users } from '@/db/schema/auth';
import {
  generateVerificationToken,
  hashVerificationToken,
  verificationTokenExpiry,
} from '@/lib/auth/email-verification';
import { getClientIp } from '@/lib/auth/get-ip';
import { hashEmailForKey } from '@/lib/auth/login-lockout';
import { resendVerificationSchema } from '@/lib/auth/schemas';
import { logAuditEvent } from '@/lib/audit/log';
import { sendVerificationEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { EMAIL_VERIFY_RESEND_LIMIT } from '@/lib/rate-limit-configs';
import { verifyTurnstile } from '@/lib/turnstile';

const GENERIC_OK = { success: true } as const;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipRl = await checkRateLimit(
    `email-verify-resend:ip:${ip}`,
    EMAIL_VERIFY_RESEND_LIMIT,
  );
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(ipRl.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);

  const turnstile = await verifyTurnstile(body?.turnstileToken, ip);
  if (!turnstile.success) {
    return NextResponse.json(
      { error: 'Verification failed. Please try again.' },
      { status: 400 },
    );
  }

  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(GENERIC_OK);
  }

  const email = parsed.data.email.toLowerCase().trim();
  const emailHash = hashEmailForKey(email);

  const emailRl = await checkRateLimit(
    `email-verify-resend:email:${emailHash}`,
    EMAIL_VERIFY_RESEND_LIMIT,
  );
  if (!emailRl.allowed) {
    return NextResponse.json(GENERIC_OK);
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, email: true, emailVerified: true, hashedPassword: true },
    });

    // Only reissue for unverified credentials accounts.
    if (user && !user.emailVerified && user.hashedPassword) {
      const rawToken = generateVerificationToken();
      await db.insert(emailVerificationTokens).values({
        userId: user.id,
        token: hashVerificationToken(rawToken),
        expiresAt: verificationTokenExpiry(),
      });

      try {
        await sendVerificationEmail(user.email, rawToken);
      } catch (err) {
        console.error('Failed to resend verification email', err);
      }

      await logAuditEvent({
        action: 'email_verification_sent',
        userId: user.id,
        request,
        metadata: { emailHash },
      });
    }
  } catch (err) {
    console.error('Resend verification failed', err);
  }

  return NextResponse.json(GENERIC_OK);
}
