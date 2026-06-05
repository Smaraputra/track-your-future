import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { apiTokens, type ApiTokenScope } from '@/db/schema/api-tokens';
import { hashApiToken } from '@/lib/crypto/api-token';

export interface ApiTokenContext {
  userId: string;
  tokenId: string;
  scope: ApiTokenScope;
}

/** Skip the lastUsedAt write if it was updated within this window. */
const LAST_USED_THROTTLE_MS = 60_000;
const BEARER_PREFIX = 'Bearer ';

function extractBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')?.trim();
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null;
  const token = header.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

/**
 * Resolve an API token from the request's `Authorization: Bearer` header.
 * Returns the owning user + token scope, or null if the token is missing,
 * malformed, unknown, revoked, or expired.
 */
export async function authenticateApiToken(
  request: Request,
): Promise<ApiTokenContext | null> {
  const token = extractBearerToken(request);
  if (!token) return null;

  const tokenHash = hashApiToken(token);
  const record = await db.query.apiTokens.findFirst({
    where: and(eq(apiTokens.tokenHash, tokenHash), isNull(apiTokens.revokedAt)),
  });

  if (!record) return null;
  if (record.expiresAt && record.expiresAt.getTime() < Date.now()) return null;

  // Throttled, fire-and-forget last-used bookkeeping.
  if (
    !record.lastUsedAt ||
    Date.now() - record.lastUsedAt.getTime() > LAST_USED_THROTTLE_MS
  ) {
    void db
      .update(apiTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiTokens.id, record.id))
      .catch(() => {});
  }

  return { userId: record.userId, tokenId: record.id, scope: record.scope };
}

/** Whether a token scope permits write operations. Write implies read. */
export function tokenCanWrite(scope: ApiTokenScope): boolean {
  return scope === 'write';
}
