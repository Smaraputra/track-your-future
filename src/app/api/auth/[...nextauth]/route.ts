import { type NextRequest, NextResponse } from 'next/server';

import { handlers } from '@/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { LOGIN_RATE_LIMIT } from '@/lib/auth/rate-limit-config';
import { getClientIp } from '@/lib/auth/get-ip';

export const { GET } = handlers;

export async function POST(request: NextRequest) {
  // Only rate-limit credential sign-in attempts
  if (request.nextUrl.pathname.endsWith('/callback/credentials')) {
    const ip = getClientIp(request);
    const rl = await checkRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rl.retryAfterSeconds) },
        },
      );
    }
  }

  return handlers.POST(request);
}
