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

  async function createDocument(userId: string): Promise<string> {
    const database = await getDb();
    const { documents } = await import('@/db/schema/core');
    const [doc] = await database
      .insert(documents)
      .values({
        userId,
        documentType: 'cv',
        fileName: 'resume.pdf',
        fileKey: `${userId}/test/cv/${crypto.randomUUID()}/v1/resume.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        version: 1,
        isLatest: true,
      })
      .returning({ id: documents.id });
    return doc.id;
  }

  function appCtx(applicationId: string) {
    return { params: Promise.resolve({ applicationId }) };
  }

  async function historyFor(applicationId: string) {
    const database = await getDb();
    const { applicationStatusHistory } = await import('@/db/schema/applications');
    return database
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId));
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

  it('PATCH persists currentStatus and records a history transition', async () => {
    const userId = await createTestUser('patch-status');
    const appId = await createApplication(userId, 'StatusCo'); // draft
    const token = await issueToken(userId, { scope: 'write' });

    const { PATCH } = await import('@/app/api/v1/applications/[applicationId]/route');
    const req = new Request(`http://localhost/api/v1/applications/${appId}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ currentStatus: 'rejected' }),
    });
    const res = await PATCH(req, appCtx(appId));
    expect(res.status).toBe(200);

    const database = await getDb();
    const { applications } = await import('@/db/schema/applications');
    const [app] = await database
      .select()
      .from(applications)
      .where(eq(applications.id, appId));
    expect(app.currentStatus).toBe('rejected');

    const history = await historyFor(appId);
    expect(history).toHaveLength(1);
    expect(history[0].fromStatus).toBe('draft');
    expect(history[0].toStatus).toBe('rejected');
  });

  it('PATCH does not record history when the status is unchanged', async () => {
    const userId = await createTestUser('patch-nostatus');
    const appId = await createApplication(userId, 'NoChangeCo'); // draft
    const token = await issueToken(userId, { scope: 'write' });

    const { PATCH } = await import('@/app/api/v1/applications/[applicationId]/route');
    const req = new Request(`http://localhost/api/v1/applications/${appId}`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ jobTitle: 'New Title', currentStatus: 'draft' }),
    });
    const res = await PATCH(req, appCtx(appId));
    expect(res.status).toBe(200);

    const database = await getDb();
    const { applications } = await import('@/db/schema/applications');
    const [app] = await database
      .select()
      .from(applications)
      .where(eq(applications.id, appId));
    expect(app.jobTitle).toBe('New Title');
    expect(await historyFor(appId)).toHaveLength(0);
  });

  it('POST records an initial draft -> status row for non-draft creations', async () => {
    const userId = await createTestUser('create-status');
    const token = await issueToken(userId, { scope: 'write' });

    const { POST } = await import('@/app/api/v1/applications/route');
    const req = new Request('http://localhost/api/v1/applications', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        companyName: 'CreatedApplied',
        jobTitle: 'Engineer',
        currentStatus: 'applied',
      }),
    });
    const res = await POST(req, {} as never);
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string };

    const history = await historyFor(created.id);
    expect(history).toHaveLength(1);
    expect(history[0].fromStatus).toBe('draft');
    expect(history[0].toStatus).toBe('applied');
  });

  it('POST does not record history for draft creations', async () => {
    const userId = await createTestUser('create-draft');
    const token = await issueToken(userId, { scope: 'write' });

    const { POST } = await import('@/app/api/v1/applications/route');
    const req = new Request('http://localhost/api/v1/applications', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ companyName: 'CreatedDraft', jobTitle: 'Engineer' }),
    });
    const res = await POST(req, {} as never);
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string };

    expect(await historyFor(created.id)).toHaveLength(0);
  });

  it('links, lists, and unlinks a document via the v1 endpoint', async () => {
    const userId = await createTestUser('doclink');
    const appId = await createApplication(userId, 'DocLinkCo');
    const docId = await createDocument(userId);
    const token = await issueToken(userId, { scope: 'write' });

    const { GET, POST, DELETE } = await import(
      '@/app/api/v1/applications/[applicationId]/documents/route'
    );
    const base = `http://localhost/api/v1/applications/${appId}/documents`;

    const linkRes = await POST(
      new Request(base, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      }),
      appCtx(appId),
    );
    expect(linkRes.status).toBe(201);

    const listRes = await GET(
      new Request(base, { headers: { authorization: `Bearer ${token}` } }),
      appCtx(appId),
    );
    expect(listRes.status).toBe(200);
    const docs = (await listRes.json()) as Array<{ id: string }>;
    expect(docs).toHaveLength(1);
    expect(docs[0].id).toBe(docId);

    const delRes = await DELETE(
      new Request(`${base}?documentId=${docId}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${token}` },
      }),
      appCtx(appId),
    );
    expect(delRes.status).toBe(200);

    const afterRes = await GET(
      new Request(base, { headers: { authorization: `Bearer ${token}` } }),
      appCtx(appId),
    );
    expect((await afterRes.json()) as unknown[]).toHaveLength(0);
  });

  it('rejects document linking with a read-only token', async () => {
    const userId = await createTestUser('doclink-read');
    const appId = await createApplication(userId, 'ReadOnlyCo');
    const docId = await createDocument(userId);
    const readToken = await issueToken(userId, { scope: 'read' });

    const { POST } = await import(
      '@/app/api/v1/applications/[applicationId]/documents/route'
    );
    const res = await POST(
      new Request(`http://localhost/api/v1/applications/${appId}/documents`, {
        method: 'POST',
        headers: { authorization: `Bearer ${readToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({ documentId: docId }),
      }),
      appCtx(appId),
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when linking another tenant's document", async () => {
    const userA = await createTestUser('doclink-A');
    const userB = await createTestUser('doclink-B');
    const appId = await createApplication(userA, 'TenantACo');
    const otherDocId = await createDocument(userB);
    const tokenA = await issueToken(userA, { scope: 'write' });

    const { POST } = await import(
      '@/app/api/v1/applications/[applicationId]/documents/route'
    );
    const res = await POST(
      new Request(`http://localhost/api/v1/applications/${appId}/documents`, {
        method: 'POST',
        headers: { authorization: `Bearer ${tokenA}`, 'content-type': 'application/json' },
        body: JSON.stringify({ documentId: otherDocId }),
      }),
      appCtx(appId),
    );
    expect(res.status).toBe(404);
  });

  it('returns 409 when linking an already-linked document', async () => {
    const userId = await createTestUser('doclink-dup');
    const appId = await createApplication(userId, 'DupLinkCo');
    const docId = await createDocument(userId);
    const token = await issueToken(userId, { scope: 'write' });

    const { POST } = await import(
      '@/app/api/v1/applications/[applicationId]/documents/route'
    );
    const link = () =>
      POST(
        new Request(`http://localhost/api/v1/applications/${appId}/documents`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ documentId: docId }),
        }),
        appCtx(appId),
      );

    expect((await link()).status).toBe(201);
    const dup = await link();
    expect(dup.status).toBe(409);
    const body = (await dup.json()) as { error: { code: string } };
    expect(body.error.code).toBe('already_linked');
  });
});
