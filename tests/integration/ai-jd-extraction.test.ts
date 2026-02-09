import { and, eq } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('AI JD extraction integration', () => {
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
      email: `jd-test-${suffix}-${userId}@example.com`,
      name: `JD Test ${suffix}`,
      emailVerified: new Date(),
    });
    return userId;
  }

  async function createTestApplication(userId: string) {
    const { applications } = await import('@/db/schema/applications');
    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'Test Corp',
        jobTitle: 'Engineer',
        jobUrl: 'https://example.com/job/test',
        currentStatus: 'applied',
      })
      .returning();
    return app;
  }

  it('initializes database connection', async () => {
    const dbModule = await import('@/db');
    db = dbModule.db;
    expect(db).toBeDefined();
  });

  it('inserts jobAnalysis with valid data', async () => {
    const { jobAnalyses } = await import('@/db/schema/ai');
    const userId = await createTestUser('jd-insert');
    const app = await createTestApplication(userId);

    const analysisData = {
      companyName: 'Test Corp',
      jobTitle: 'Engineer',
      requiredSkills: ['TypeScript'],
      preferredSkills: ['Go'],
    };

    const [analysis] = await db
      .insert(jobAnalyses)
      .values({
        userId,
        applicationId: app.id,
        sourceUrl: 'https://example.com/job/test',
        rawText: 'Test job description text',
        analysis: analysisData,
      })
      .returning();

    expect(analysis.id).toBeDefined();
    expect(analysis.userId).toBe(userId);
    expect(analysis.applicationId).toBe(app.id);
    expect(analysis.analysis).toEqual(analysisData);
    expect(analysis.sourceUrl).toBe('https://example.com/job/test');
  });

  it('sets applicationId to null when application is deleted', async () => {
    const { jobAnalyses } = await import('@/db/schema/ai');
    const { applications } = await import('@/db/schema/applications');
    const userId = await createTestUser('jd-setnull');
    const app = await createTestApplication(userId);

    const [analysis] = await db
      .insert(jobAnalyses)
      .values({
        userId,
        applicationId: app.id,
        analysis: { requiredSkills: [], preferredSkills: [] },
      })
      .returning();

    // Delete the application
    await db.delete(applications).where(eq(applications.id, app.id));

    // Verify analysis still exists but applicationId is null
    const [remaining] = await db
      .select()
      .from(jobAnalyses)
      .where(eq(jobAnalyses.id, analysis.id));

    expect(remaining).toBeDefined();
    expect(remaining.applicationId).toBeNull();
  });

  it('inserts aiUsage row with jd_extraction feature', async () => {
    const { aiUsage } = await import('@/db/schema/ai');
    const userId = await createTestUser('jd-usage');

    const [row] = await db
      .insert(aiUsage)
      .values({
        userId,
        feature: 'jd_extraction',
        model: 'gpt-4.1-nano',
        inputTokens: 800,
        outputTokens: 300,
        costCents: '0.0200',
      })
      .returning();

    expect(row.feature).toBe('jd_extraction');
    expect(row.model).toBe('gpt-4.1-nano');
    expect(row.inputTokens).toBe(800);
    expect(row.outputTokens).toBe(300);
  });

  it('upsert: second insert for same applicationId replaces first', async () => {
    const { jobAnalyses } = await import('@/db/schema/ai');
    const userId = await createTestUser('jd-upsert');
    const app = await createTestApplication(userId);

    // First insert
    await db.insert(jobAnalyses).values({
      userId,
      applicationId: app.id,
      analysis: { requiredSkills: ['JS'], preferredSkills: [] },
    });

    // Delete old + insert new (upsert pattern)
    await db.transaction(async (tx) => {
      await tx
        .delete(jobAnalyses)
        .where(
          and(
            eq(jobAnalyses.applicationId, app.id),
            eq(jobAnalyses.userId, userId),
          ),
        );
      await tx.insert(jobAnalyses).values({
        userId,
        applicationId: app.id,
        analysis: {
          requiredSkills: ['TS', 'React'],
          preferredSkills: ['Go'],
        },
      });
    });

    // Verify only one analysis exists
    const analyses = await db
      .select()
      .from(jobAnalyses)
      .where(
        and(
          eq(jobAnalyses.applicationId, app.id),
          eq(jobAnalyses.userId, userId),
        ),
      );

    expect(analyses).toHaveLength(1);
    expect(
      (analyses[0].analysis as { requiredSkills: string[] }).requiredSkills,
    ).toEqual(['TS', 'React']);
  });

  it('multi-tenancy: user A cannot read user B analysis', async () => {
    const { jobAnalyses } = await import('@/db/schema/ai');
    const userA = await createTestUser('jd-tenant-A');
    const userB = await createTestUser('jd-tenant-B');
    const appA = await createTestApplication(userA);

    await db.insert(jobAnalyses).values({
      userId: userA,
      applicationId: appA.id,
      analysis: { requiredSkills: [], preferredSkills: [] },
    });

    // Query as user B
    const results = await db
      .select()
      .from(jobAnalyses)
      .where(
        and(
          eq(jobAnalyses.applicationId, appA.id),
          eq(jobAnalyses.userId, userB),
        ),
      );

    expect(results).toHaveLength(0);
  });
});
