import type { RateLimitConfig } from '@/lib/rate-limit';

/** Login: 5 attempts per 15 minutes per IP+email combo */
export const LOGIN_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 15 * 60,
};

/** Registration: 3 per hour per IP */
export const REGISTER_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 60 * 60,
};

/** Password reset request: 3 per hour per IP */
export const RESET_PASSWORD_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 60 * 60,
};

/** Email verification: 10 per hour per IP */
export const VERIFY_EMAIL_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60 * 60,
};
