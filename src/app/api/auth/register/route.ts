import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema/auth';
import { registerSchema } from '@/lib/auth/schemas';
import { hashPassword } from '@/lib/auth/password';
import { generateToken, hashToken } from '@/lib/auth/tokens';
import { sendVerificationEmail } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import { REGISTER_RATE_LIMIT } from '@/lib/auth/rate-limit-config';
import { getClientIp } from '@/lib/auth/get-ip';

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`register:${ip}`, REGISTER_RATE_LIMIT);
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, email: rawEmail, password } = parsed.data;
  const email = rawEmail.toLowerCase().trim();

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 },
    );
  }

  const hashedPw = await hashPassword(password);

  await db.insert(users).values({
    name,
    email,
    hashedPassword: hashedPw,
    emailVerified: null,
  });

  const rawToken = generateToken();
  const hashed = hashToken(rawToken);
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await db.insert(verificationTokens).values({
    identifier: email,
    token: hashed,
    expires,
  });

  await sendVerificationEmail(email, rawToken);

  return NextResponse.json(
    { message: 'Check your email to verify your account' },
    { status: 201 },
  );
}
