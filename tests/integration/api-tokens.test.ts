// @vitest-environment node
import { eq } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

type Db = Awaited<typeof import('@/db')>['db'];

describe.skipIf(!DATABASE_URL)('API token system integration', () => {
  let db: Db;
  const testUserIds: string[] = [];

  afterAll(async () => {
    if (!db) return;
    const { users } = await import('@/db/schema/auth');
    for (const userId of testUserIds) {
      // Cascades remove api_tokens + applications owned by the user.
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  async function getDb(): Promise<Db> {
    if (!db) db = (await import('@/db')).db;
    return db;
  }

  async function createTestUser(suffix: string): Promise<string> {
    const database = await getDb();
    const { users } = await import('@/db/schema/auth');
    const userId = crypto.randomUUID();
    testUserIds.push(userId);
    await database.insert(users).values({
      id: userId,
      email: `apitok-${suffix}-${userId}@example.com`,
      name: `API Token User ${suffix}`,
      emailVerified: new Date(),
    });
    return userId;
  }

  async function issueToken(
    userId: string,
    opts: { scope?: 'read' | 'write'; expiresAt?: Date | null; revoked?: boolean } = {},
  ): Promise<string> {
    const database = await getDb();
    const { apiTokens } = await import('@/db/schema/api-tokens');
    const { generateApiToken } = await import('@/lib/crypto/api-token');
    const { token, tokenHash, tokenPrefix } = generateApiToken();
    await database.insert(apiTokens).values({
      userId,
      name: 'integration',
      tokenHash,
      tokenPrefix,
      scope: opts.scope ?? 'write',
      expiresAt: opts.expiresAt ?? null,
      revokedAt: opts.revoked ? new Date() : null,
    });
    return token;
  }

  function bearer(token: string, url = 'http://localhost/api/v1/applications'): Request {
    return new Request(url, { headers: { authorization: `Bearer ${token}` } });
  }

  async function createApplication(userId: string, companyName: string): Promise<string> {
    const database = await getDb();
    const { applications } = await import('@/db/schema/applications');
    const [app] = await database
      .insert(applications)
      .values({ userId, companyName, jobTitle: 'Engineer', currentStatus: 'draft' })
      .returning({ id: applications.id });
    return app.id;
  }

  it('resolves a valid token to its owner', async () => {
    const userId = await createTestUser('resolve');
    const token = await issueToken(userId);
    const { authenticateApiToken } = await import('@/lib/auth/api-token');

    const ctx = await authenticateApiToken(bearer(token));
    expect(ctx?.userId).toBe(userId);
    expect(ctx?.scope).toBe('write');
  });

  it('isolates data between tenants on list', async () => {
    const userA = await createTestUser('tenantA');
    const userB = await createTestUser('tenantB');
    await createApplication(userA, 'Acme A');
    await createApplication(userB, 'Globex B');
    const tokenA = await issueToken(userA, { scope: 'read' });

    const { GET } = await import('@/app/api/v1/applications/route');
    const res = await GET(bearer(tokenA), {} as never);
    expect(res.status).toBe(200);
    const rows = (await res.json()) as Array<{ userId: string; companyName: string }>;

    expect(rows.length).toBe(1);
    expect(rows[0].userId).toBe(userA);
    expect(rows[0].companyName).toBe('Acme A');
  });

  it("returns 404 for another tenant's resource by id", async () => {
    const userA = await createTestUser('byidA');
    const userB = await createTestUser('byidB');
    const bAppId = await createApplication(userB, 'Globex B2');
    const tokenA = await issueToken(userA, { scope: 'read' });

    const { GET } = await import('@/app/api/v1/applications/[applicationId]/route');
    const res = await GET(bearer(tokenA), {
      params: Promise.resolve({ applicationId: bAppId }),
    });
    expect(res.status).toBe(404);
  });

  it('enforces read vs write scope', async () => {
    const userId = await createTestUser('scope');
    const readToken = await issueToken(userId, { scope: 'read' });
    const writeToken = await issueToken(userId, { scope: 'write' });

    const { POST } = await import('@/app/api/v1/applications/route');

    const makeBody = (company: string) =>
      new Request('http://localhost/api/v1/applications', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${company === 'readtest' ? readToken : writeToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ companyName: company, jobTitle: 'Engineer' }),
      });

    const denied = await POST(makeBody('readtest'), {} as never);
    expect(denied.status).toBe(403);
    const deniedBody = (await denied.json()) as { error: { code: string } };
    expect(deniedBody.error.code).toBe('insufficient_scope');

    const allowed = await POST(makeBody('writetest'), {} as never);
    expect(allowed.status).toBe(201);
    const created = (await allowed.json()) as { userId: string; companyName: string };
    expect(created.userId).toBe(userId);
    expect(created.companyName).toBe('writetest');
  });

  it('rejects an expired token with 401', async () => {
    const userId = await createTestUser('expired');
    const token = await issueToken(userId, { expiresAt: new Date(Date.now() - 1000) });

    const { GET } = await import('@/app/api/v1/applications/route');
    const res = await GET(bearer(token), {} as never);
    expect(res.status).toBe(401);
  });

  it('rejects a revoked token with 401', async () => {
    const userId = await createTestUser('revoked');
    const token = await issueToken(userId, { revoked: true });

    const { GET } = await import('@/app/api/v1/applications/route');
    const res = await GET(bearer(token), {} as never);
    expect(res.status).toBe(401);
  });

  it('rejects requests with no token', async () => {
    const { GET } = await import('@/app/api/v1/applications/route');
    const res = await GET(new Request('http://localhost/api/v1/applications'), {} as never);
    expect(res.status).toBe(401);
  });

  it('counts only active tokens toward the tier cap', async () => {
    const userId = await createTestUser('cap');
    const { checkResourceLimit } = await import('@/lib/billing/feature-gate');

    await issueToken(userId);
    await issueToken(userId);
    const atTwo = await checkResourceLimit(userId, 'apiTokens', 'free');
    expect(atTwo.current).toBe(2);
    // Free cap is 2; only assert when billing (and thus the cap) is enabled.
    if (atTwo.limit !== null) expect(atTwo.allowed).toBe(false);

    // A revoked token does not count.
    await issueToken(userId, { revoked: true });
    const stillTwo = await checkResourceLimit(userId, 'apiTokens', 'free');
    expect(stillTwo.current).toBe(2);
  });
});
