import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema/auth';
import { resetPasswordRequestSchema } from '@/lib/auth/schemas';
import { generateToken, hashToken } from '@/lib/auth/tokens';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { RESET_PASSWORD_RATE_LIMIT } from '@/lib/auth/rate-limit-config';
import { getClientIp } from '@/lib/auth/get-ip';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`reset-pw:${ip}`, RESET_PASSWORD_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = resetPasswordRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  // Always return 200 to prevent email enumeration
  const successResponse = NextResponse.json({
    message: 'If an account exists with this email, a reset link has been sent',
  });

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) return successResponse;

  const rawToken = generateToken();
  const hashed = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token: hashed,
    expiresAt,
  });

  await sendPasswordResetEmail(email, rawToken);

  return successResponse;
}
