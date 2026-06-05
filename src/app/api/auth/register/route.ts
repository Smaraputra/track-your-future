import { type NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users, emailVerificationTokens } from '@/db/schema/auth';
import {
  generateVerificationToken,
  hashVerificationToken,
  verificationTokenExpiry,
} from '@/lib/auth/email-verification';
import { getClientIp } from '@/lib/auth/get-ip';
import { hashEmailForKey } from '@/lib/auth/login-lockout';
import { hashPassword } from '@/lib/auth/password';
import { registerSchema } from '@/lib/auth/schemas';
import { logAuditEvent } from '@/lib/audit/log';
import { sendAccountExistsEmail, sendVerificationEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { REGISTER_LIMIT } from '@/lib/rate-limit-configs';

const GENERIC_OK = { success: true } as const;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipRl = await checkRateLimit(`register:ip:${ip}`, REGISTER_LIMIT);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(ipRl.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid registration details.' },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const emailHash = hashEmailForKey(email);

  const emailRl = await checkRateLimit(`register:email:${emailHash}`, REGISTER_LIMIT);
  if (!emailRl.allowed) {
    return NextResponse.json(GENERIC_OK);
  }

  try {
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true, email: true, emailVerified: true },
    });

    if (existing && existing.emailVerified) {
      // Already verified: avoid leaking existence in the response; send a notice.
      try {
        await sendAccountExistsEmail(existing.email);
      } catch (err) {
        console.error('Failed to send account-exists email', err);
      }
    } else {
      const hashed = await hashPassword(parsed.data.password);
      let userId: string;

      if (existing) {
        // Unverified credentials account (abandoned signup): reuse and refresh.
        await db
          .update(users)
          .set({ name: parsed.data.name, hashedPassword: hashed })
          .where(eq(users.id, existing.id));
        userId = existing.id;
      } else {
        const [created] = await db
          .insert(users)
          .values({ name: parsed.data.name, email, hashedPassword: hashed })
          .returning({ id: users.id });
        userId = created.id;
      }

      const rawToken = generateVerificationToken();
      await db.insert(emailVerificationTokens).values({
        userId,
        token: hashVerificationToken(rawToken),
        expiresAt: verificationTokenExpiry(),
      });

      try {
        await sendVerificationEmail(email, rawToken);
      } catch (err) {
        console.error('Failed to send verification email', err);
      }

      await logAuditEvent({
        action: existing ? 'email_verification_sent' : 'user_registered',
        userId,
        request,
        metadata: { emailHash },
      });
    }
  } catch (err) {
    console.error('Registration failed', err);
  }

  return NextResponse.json(GENERIC_OK);
}
