import type { ApiTokenScope } from '@/db/schema/api-tokens';
import {
  authenticateApiToken,
  tokenCanWrite,
  type ApiTokenContext,
} from '@/lib/auth/api-token';
import { checkRateLimit } from '@/lib/rate-limit';
import { API_TOKEN_LIMIT } from '@/lib/rate-limit-configs';
import { apiError } from './response';

type ApiHandler<Ctx> = (
  request: Request,
  ctx: Ctx,
  auth: ApiTokenContext,
) => Promise<Response> | Response;

/**
 * Wraps a `/api/v1` route handler with bearer-token auth, per-owner rate
 * limiting, and scope enforcement. The wrapped handler receives the resolved
 * token context (userId + scope) as its third argument and is responsible for
 * scoping every query to `auth.userId`.
 *
 * `required` is the minimum scope: 'read' allows any valid token, 'write'
 * requires a write token (write implies read).
 */
export function withApiToken<Ctx>(
  required: ApiTokenScope,
  handler: ApiHandler<Ctx>,
): (request: Request, ctx: Ctx) => Promise<Response> {
  return async (request, ctx) => {
    const auth = await authenticateApiToken(request);
    if (!auth) {
      return apiError(
        'unauthorized',
        'Missing or invalid API token. Provide a valid "Authorization: Bearer <token>" header.',
        401,
        { headers: { 'WWW-Authenticate': 'Bearer' } },
      );
    }

    const rl = await checkRateLimit(`apiv1:${auth.userId}`, API_TOKEN_LIMIT);
    if (!rl.allowed) {
      return apiError('rate_limited', 'Rate limit exceeded. Slow down.', 429, {
        headers: { 'Retry-After': String(rl.retryAfterSeconds) },
      });
    }

    if (required === 'write' && !tokenCanWrite(auth.scope)) {
      return apiError(
        'insufficient_scope',
        'This token is read-only. A token with write scope is required.',
        403,
      );
    }

    return handler(request, ctx, auth);
  };
}

/** Parse a JSON request body, returning null on malformed input. */
export async function readJsonBody(request: Request): Promise<unknown | null> {
  return request.json().catch(() => null);
}
