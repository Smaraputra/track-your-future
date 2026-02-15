import type { RateLimitConfig } from '@/lib/rate-limit';

/** Login: 5 attempts per 15 minutes per IP+email combo */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 15 * 60,
};
