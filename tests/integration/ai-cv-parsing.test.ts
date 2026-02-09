import { and, eq } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('AI CV parsing integration', () => {
  let db: Awaited<typeof import('@/db')>['db'];
  const testUserIds: string[] = [];

  afterAll(async () => {
    if (!db) return;
    const { users } = await import('@/db/schema/auth');
    for (const userId of testUserIds) {
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  async function createTestUser(suffix: string) {
    const { users } = await import('@/db/schema/auth');
    const userId = crypto.randomUUID();
    testUserIds.push(userId);
    await db.insert(users).values({
      id: userId,
      email: `ai-test-${suffix}-${userId}@example.com`,
      name: `AI Test ${suffix}`,
      emailVerified: new Date(),
    });
    return userId;
  }

  async function createTestDocument(userId: string) {
    const { documents } = await import('@/db/schema/core');
    const [doc] = await db
      .insert(documents)
      .values({
        userId,
        documentType: 'cv',
        fileName: 'test-cv.pdf',
        fileKey: `${userId}/test/cv/${crypto.randomUUID()}/v1/test-cv.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        version: 1,
        isLatest: true,
      })
      .returning();
    return doc;
  }

  it('initializes database connection', async () => {
    const dbModule = await import('@/db');
    db = dbModule.db;
    expect(db).toBeDefined();
  });

  it('inserts parsedProfile with valid data', async () => {
    const { parsedProfiles } = await import('@/db/schema/ai');
    const userId = await createTestUser('parse-insert');
    const doc = await createTestDocument(userId);

    const parsedData = {
      name: 'Test User',
      skills: ['TypeScript'],
      experience: [],
      education: [],
    };

    const [profile] = await db
      .insert(parsedProfiles)
      .values({
        userId,
        documentId: doc.id,
        parsedData,
        rawText: 'Test CV text content',
        confidenceScore: '0.85',
      })
      .returning();

    expect(profile.id).toBeDefined();
    expect(profile.userId).toBe(userId);
    expect(profile.documentId).toBe(doc.id);
    expect(profile.parsedData).toEqual(parsedData);
    expect(profile.confidenceScore).toBe('0.85');
  });

  it('cascade: deleting document deletes parsedProfile', async () => {
    const { parsedProfiles } = await import('@/db/schema/ai');
    const { documents } = await import('@/db/schema/core');
    const userId = await createTestUser('parse-cascade');
    const doc = await createTestDocument(userId);

    await db.insert(parsedProfiles).values({
      userId,
      documentId: doc.id,
      parsedData: { skills: [], experience: [], education: [] },
      rawText: 'Test',
      confidenceScore: '0.50',
    });

    // Delete the document
    await db.delete(documents).where(eq(documents.id, doc.id));

    // Verify profile is also deleted
    const remaining = await db
      .select()
      .from(parsedProfiles)
      .where(eq(parsedProfiles.documentId, doc.id));

    expect(remaining).toHaveLength(0);
  });

  it('inserts aiUsage row with correct feature and model', async () => {
    const { aiUsage } = await import('@/db/schema/ai');
    const userId = await createTestUser('ai-usage');

    const [row] = await db
      .insert(aiUsage)
      .values({
        userId,
        feature: 'parse',
        model: 'gpt-4.1-nano',
        inputTokens: 500,
        outputTokens: 200,
        costCents: '0.0130',
      })
      .returning();

    expect(row.feature).toBe('parse');
    expect(row.model).toBe('gpt-4.1-nano');
    expect(row.inputTokens).toBe(500);
    expect(row.outputTokens).toBe(200);
    expect(row.costCents).toBe('0.0130');
  });

  it('upsert: second insert for same documentId replaces first', async () => {
    const { parsedProfiles } = await import('@/db/schema/ai');
    const userId = await createTestUser('parse-upsert');
    const doc = await createTestDocument(userId);

    // First insert
    await db.insert(parsedProfiles).values({
      userId,
      documentId: doc.id,
      parsedData: { skills: ['JS'], experience: [], education: [] },
      rawText: 'First parse',
      confidenceScore: '0.50',
    });

    // Delete old + insert new (upsert pattern)
    await db.transaction(async (tx) => {
      await tx
        .delete(parsedProfiles)
        .where(
          and(
            eq(parsedProfiles.documentId, doc.id),
            eq(parsedProfiles.userId, userId),
          ),
        );
      await tx.insert(parsedProfiles).values({
        userId,
        documentId: doc.id,
        parsedData: { skills: ['TS', 'React'], experience: [], education: [] },
        rawText: 'Second parse',
        confidenceScore: '0.75',
      });
    });

    // Verify only one profile exists
    const profiles = await db
      .select()
      .from(parsedProfiles)
      .where(eq(parsedProfiles.documentId, doc.id));

    expect(profiles).toHaveLength(1);
    expect((profiles[0].parsedData as { skills: string[] }).skills).toEqual([
      'TS',
      'React',
    ]);
    expect(profiles[0].confidenceScore).toBe('0.75');
  });

  it('multi-tenancy: user A cannot read user B profile', async () => {
    const { parsedProfiles } = await import('@/db/schema/ai');
    const userA = await createTestUser('tenant-A');
    const userB = await createTestUser('tenant-B');
    const docA = await createTestDocument(userA);

    await db.insert(parsedProfiles).values({
      userId: userA,
      documentId: docA.id,
      parsedData: { skills: [], experience: [], education: [] },
      rawText: 'User A CV',
      confidenceScore: '0.60',
    });

    // Query as user B
    const results = await db
      .select()
      .from(parsedProfiles)
      .where(
        and(
          eq(parsedProfiles.documentId, docA.id),
          eq(parsedProfiles.userId, userB),
        ),
      );

    expect(results).toHaveLength(0);
  });
});
