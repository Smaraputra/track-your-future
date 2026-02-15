import type { RateLimitConfig } from '@/lib/rate-limit';

/** Password change: 5 per 15 minutes, fail closed */
export const PASSWORD_CHANGE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 15 * 60,
  failClosed: true,
};

/** Account deletion: 3 per hour, fail closed */
export const ACCOUNT_DELETE_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 60 * 60,
  failClosed: true,
};

/** Checkout session creation: 10 per 15 minutes */
export const CHECKOUT_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 15 * 60,
};

/** Trial activation: 3 per hour */
export const TRIAL_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 60 * 60,
};

/** Presigned URL creation: 30 per minute */
export const PRESIGN_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowSeconds: 60,
};

/** Data export: 3 per hour */
export const EXPORT_LIMIT: RateLimitConfig = {
  maxRequests: 3,
  windowSeconds: 60 * 60,
};

/** AI burst protection: 10 per minute (shared across all AI features) */
export const AI_BURST_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60,
};
