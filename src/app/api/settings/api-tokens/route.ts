import { NextResponse } from 'next/server';
import { and, desc, eq, isNull } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { apiTokens } from '@/db/schema/api-tokens';
import { createApiTokenSchema } from '@/lib/api-tokens/schemas';
import { generateApiToken } from '@/lib/crypto/api-token';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { checkRateLimit } from '@/lib/rate-limit';
import { API_TOKEN_MANAGEMENT_LIMIT } from '@/lib/rate-limit-configs';
import { logAuditEvent } from '@/lib/audit/log';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tokens = await db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      tokenPrefix: apiTokens.tokenPrefix,
      scope: apiTokens.scope,
      lastUsedAt: apiTokens.lastUsedAt,
      expiresAt: apiTokens.expiresAt,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(
      and(eq(apiTokens.userId, session.user.id), isNull(apiTokens.revokedAt)),
    )
    .orderBy(desc(apiTokens.createdAt));

  return NextResponse.json(tokens);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const rl = await checkRateLimit(
    `api-token-mgmt:${userId}`,
    API_TOKEN_MANAGEMENT_LIMIT,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many token requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createApiTokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Enforce per-tier token count cap.
  const sub = await getUserSubscription(userId);
  const limit = await checkResourceLimit(userId, 'apiTokens', sub.tier);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: `API token limit reached (${limit.limit}). Revoke an existing token or upgrade to Pro for unlimited tokens.`,
        limit: limit.limit,
        current: limit.current,
      },
      { status: 403 },
    );
  }

  const { name, scope, expiresInDays } = parsed.data;
  const { token, tokenHash, tokenPrefix } = generateApiToken();
  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * DAY_MS)
    : null;

  const [created] = await db
    .insert(apiTokens)
    .values({ userId, name, tokenHash, tokenPrefix, scope, expiresAt })
    .returning({
      id: apiTokens.id,
      name: apiTokens.name,
      tokenPrefix: apiTokens.tokenPrefix,
      scope: apiTokens.scope,
      lastUsedAt: apiTokens.lastUsedAt,
      expiresAt: apiTokens.expiresAt,
      createdAt: apiTokens.createdAt,
    });

  await logAuditEvent({
    action: 'api_token_created',
    userId,
    request,
    metadata: { tokenId: created.id, name, scope },
  });

  // The plaintext token is returned exactly once and never stored.
  return NextResponse.json({ ...created, token }, { status: 201 });
}
