import { NextResponse } from 'next/server';

import { verifyEmail } from '@/lib/auth/verify-email';
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

  const result = await verifyEmail(rawToken);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ message: 'Email verified successfully' });
}
