import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema/auth';
import { hashToken } from '@/lib/auth/tokens';
import { checkRateLimit } from '@/lib/rate-limit';
import { VERIFY_EMAIL_RATE_LIMIT } from '@/lib/auth/rate-limit-config';
import { getClientIp } from '@/lib/auth/get-ip';

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(`verify-email:${ip}`, VERIFY_EMAIL_RATE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get('token');

  if (!rawToken) {
    return NextResponse.json(
      { error: 'Missing token parameter' },
      { status: 400 },
    );
  }

  const hashed = hashToken(rawToken);

  const record = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.token, hashed),
    ),
  });

  if (!record) {
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 400 },
    );
  }

  if (record.expires < new Date()) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, record.identifier),
          eq(verificationTokens.token, hashed),
        ),
      );
    return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, record.identifier));

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, record.identifier),
        eq(verificationTokens.token, hashed),
      ),
    );

  return NextResponse.json({ message: 'Email verified successfully' });
}
