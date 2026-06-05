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

/** Password reset request: 5 per hour (per IP and per email), fail closed */
export const PASSWORD_RESET_REQUEST_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 60 * 60,
  failClosed: true,
};

/** Password reset confirm: 10 per hour per IP, fail closed */
export const PASSWORD_RESET_CONFIRM_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60 * 60,
  failClosed: true,
};

/** Public API (/api/v1): 120 requests per minute, per token owner */
export const API_TOKEN_LIMIT: RateLimitConfig = {
  maxRequests: 120,
  windowSeconds: 60,
};

/** API token management (create/revoke): 20 per hour, fail closed */
export const API_TOKEN_MANAGEMENT_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowSeconds: 60 * 60,
  failClosed: true,
};
