import { and, count, eq, sum } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Documents CRUD integration', () => {
  let db: Awaited<typeof import('@/db')>['db'];
  const testUserIds: string[] = [];

  afterAll(async () => {
    if (!db) return;
    const { users } = await import('@/db/schema/auth');
    const { documents } = await import('@/db/schema/core');
    const { roleCategories } = await import('@/db/schema/core');
    for (const userId of testUserIds) {
      await db.delete(documents).where(eq(documents.userId, userId));
      await db
        .delete(roleCategories)
        .where(eq(roleCategories.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  async function createTestUser(suffix: string) {
    const { users } = await import('@/db/schema/auth');
    const userId = crypto.randomUUID();
    testUserIds.push(userId);
    await db.insert(users).values({
      id: userId,
      email: `docs-test-${suffix}-${userId}@example.com`,
      name: `Doc Test ${suffix}`,
      emailVerified: new Date(),
    });
    return userId;
  }

  async function createTestRole(userId: string, name: string) {
    const { roleCategories } = await import('@/db/schema/core');
    const [role] = await db
      .insert(roleCategories)
      .values({
        userId,
        name,
        position: 0,
      })
      .returning();
    return role;
  }

  it('inserts a document', async () => {
    const mod = await import('@/db');
    db = mod.db;
    const { documents } = await import('@/db/schema/core');

    const userId = await createTestUser('insert');

    const [doc] = await db
      .insert(documents)
      .values({
        userId,
        documentType: 'cv',
        fileName: 'resume.pdf',
        fileKey: `${userId}/unassigned/cv/doc1/v1/resume.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 102400,
        version: 1,
        isLatest: true,
      })
      .returning();

    expect(doc.id).toBeDefined();
    expect(doc.fileName).toBe('resume.pdf');
    expect(doc.documentType).toBe('cv');
    expect(doc.version).toBe(1);
    expect(doc.isLatest).toBe(true);
    expect(doc.userId).toBe(userId);
  });

  it('handles version increment and isLatest toggle', async () => {
    const { documents } = await import('@/db/schema/core');
    const userId = await createTestUser('version');

    // Insert v1
    const [v1] = await db
      .insert(documents)
      .values({
        userId,
        documentType: 'cv',
        fileName: 'resume.pdf',
        fileKey: `${userId}/unassigned/cv/docA/v1/resume.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 100000,
        version: 1,
        isLatest: true,
      })
      .returning();

    // Insert v2 -- mark v1 as not latest
    await db.transaction(async (tx) => {
      await tx
        .update(documents)
        .set({ isLatest: false })
        .where(eq(documents.id, v1.id));

      await tx.insert(documents).values({
        userId,
        documentType: 'cv',
        fileName: 'resume-v2.pdf',
        fileKey: `${userId}/unassigned/cv/docA/v2/resume-v2.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 120000,
        version: 2,
        isLatest: true,
      });
    });

    // v1 should no longer be latest
    const v1After = await db.query.documents.findFirst({
      where: eq(documents.id, v1.id),
    });
    expect(v1After!.isLatest).toBe(false);

    // Only v2 should be latest for this user's cv type
    const latest = await db
      .select()
      .from(documents)
      .where(
        and(
          eq(documents.userId, userId),
          eq(documents.isLatest, true),
        ),
      );
    expect(latest).toHaveLength(1);
    expect(latest[0].version).toBe(2);
    expect(latest[0].fileName).toBe('resume-v2.pdf');
  });

  it('counts only isLatest=true documents', async () => {
    const { documents } = await import('@/db/schema/core');
    const userId = await createTestUser('count');

    // Insert 2 docs, 1 is latest
    await db.insert(documents).values([
      {
        userId,
        documentType: 'cv',
        fileName: 'old.pdf',
        fileKey: `${userId}/unassigned/cv/docB/v1/old.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 50000,
        version: 1,
        isLatest: false,
      },
      {
        userId,
        documentType: 'cv',
        fileName: 'current.pdf',
        fileKey: `${userId}/unassigned/cv/docB/v2/current.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 60000,
        version: 2,
        isLatest: true,
      },
    ]);

    const [latestCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(
        and(eq(documents.userId, userId), eq(documents.isLatest, true)),
      );

    const [totalCount] = await db
      .select({ count: count() })
      .from(documents)
      .where(eq(documents.userId, userId));

    expect(latestCount.count).toBe(1);
    expect(totalCount.count).toBe(2);
  });

  it('sums storage bytes across all versions', async () => {
    const { documents } = await import('@/db/schema/core');
    const userId = await createTestUser('storage');

    await db.insert(documents).values([
      {
        userId,
        documentType: 'cv',
        fileName: 'v1.pdf',
        fileKey: `${userId}/unassigned/cv/docC/v1/v1.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 100000,
        version: 1,
        isLatest: false,
      },
      {
        userId,
        documentType: 'cv',
        fileName: 'v2.pdf',
        fileKey: `${userId}/unassigned/cv/docC/v2/v2.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 200000,
        version: 2,
        isLatest: true,
      },
    ]);

    const [result] = await db
      .select({ total: sum(documents.fileSizeBytes) })
      .from(documents)
      .where(eq(documents.userId, userId));

    expect(Number(result.total)).toBe(300000);
  });

  it('deletes document with version promotion', async () => {
    const { documents } = await import('@/db/schema/core');
    const userId = await createTestUser('delete-promote');

    // Insert v1 (not latest) and v2 (latest)
    const [v1] = await db
      .insert(documents)
      .values({
        userId,
        documentType: 'cv',
        fileName: 'v1.pdf',
        fileKey: `${userId}/unassigned/cv/docD/v1/v1.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 100000,
        version: 1,
        isLatest: false,
      })
      .returning();

    const [v2] = await db
      .insert(documents)
      .values({
        userId,
        documentType: 'cv',
        fileName: 'v2.pdf',
        fileKey: `${userId}/unassigned/cv/docD/v2/v2.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 120000,
        version: 2,
        isLatest: true,
      })
      .returning();

    // "Delete" v2 and promote v1
    await db
      .update(documents)
      .set({ isLatest: true })
      .where(eq(documents.id, v1.id));

    await db.delete(documents).where(eq(documents.id, v2.id));

    // v1 should now be latest
    const promoted = await db.query.documents.findFirst({
      where: eq(documents.id, v1.id),
    });
    expect(promoted!.isLatest).toBe(true);

    // v2 should be gone
    const deleted = await db.query.documents.findFirst({
      where: eq(documents.id, v2.id),
    });
    expect(deleted).toBeUndefined();
  });

  it('links documents to role categories', async () => {
    const { documents } = await import('@/db/schema/core');
    const userId = await createTestUser('role-link');
    const role = await createTestRole(userId, 'Linked Role');

    const [doc] = await db
      .insert(documents)
      .values({
        userId,
        roleCategoryId: role.id,
        documentType: 'cover_letter',
        fileName: 'cover.pdf',
        fileKey: `${userId}/${role.id}/cover_letter/docE/v1/cover.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 80000,
        version: 1,
        isLatest: true,
      })
      .returning();

    expect(doc.roleCategoryId).toBe(role.id);
  });

  it('sets roleCategoryId to null when role is deleted (onDelete: set null)', async () => {
    const { documents, roleCategories } = await import('@/db/schema/core');
    const userId = await createTestUser('role-delete');
    const role = await createTestRole(userId, 'Deletable Role');

    const [doc] = await db
      .insert(documents)
      .values({
        userId,
        roleCategoryId: role.id,
        documentType: 'cv',
        fileName: 'linked.pdf',
        fileKey: `${userId}/${role.id}/cv/docF/v1/linked.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 90000,
        version: 1,
        isLatest: true,
      })
      .returning();

    // Delete role -- should set roleCategoryId to null (not cascade delete doc)
    await db
      .delete(roleCategories)
      .where(eq(roleCategories.id, role.id));

    const found = await db.query.documents.findFirst({
      where: eq(documents.id, doc.id),
    });

    expect(found).toBeDefined();
    expect(found!.roleCategoryId).toBeNull();
  });

  it('cascades delete when user is deleted', async () => {
    const { users } = await import('@/db/schema/auth');
    const { documents } = await import('@/db/schema/core');
    const userId = await createTestUser('cascade-user');

    const [doc] = await db
      .insert(documents)
      .values({
        userId,
        documentType: 'summary',
        fileName: 'summary.pdf',
        fileKey: `${userId}/unassigned/summary/docG/v1/summary.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 50000,
        version: 1,
        isLatest: true,
      })
      .returning();

    // Delete user -- should cascade
    await db.delete(users).where(eq(users.id, userId));
    const idx = testUserIds.indexOf(userId);
    if (idx !== -1) testUserIds.splice(idx, 1);

    const found = await db.query.documents.findFirst({
      where: eq(documents.id, doc.id),
    });
    expect(found).toBeUndefined();
  });

  it('isolates documents between users (multi-tenancy)', async () => {
    const { documents } = await import('@/db/schema/core');
    const userId1 = await createTestUser('tenant-a');
    const userId2 = await createTestUser('tenant-b');

    await db.insert(documents).values({
      userId: userId1,
      documentType: 'cv',
      fileName: 'user1.pdf',
      fileKey: `${userId1}/unassigned/cv/docH/v1/user1.pdf`,
      mimeType: 'application/pdf',
      fileSizeBytes: 10000,
      version: 1,
      isLatest: true,
    });

    await db.insert(documents).values({
      userId: userId2,
      documentType: 'cv',
      fileName: 'user2.pdf',
      fileKey: `${userId2}/unassigned/cv/docI/v1/user2.pdf`,
      mimeType: 'application/pdf',
      fileSizeBytes: 20000,
      version: 1,
      isLatest: true,
    });

    const user1Docs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId1));

    const user2Docs = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId2));

    expect(user1Docs).toHaveLength(1);
    expect(user1Docs[0].fileName).toBe('user1.pdf');
    expect(user2Docs).toHaveLength(1);
    expect(user2Docs[0].fileName).toBe('user2.pdf');
  });
});
