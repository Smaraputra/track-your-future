import { and, eq } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Applications CRUD integration', () => {
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
      email: `apps-test-${suffix}-${userId}@example.com`,
      name: `Test User ${suffix}`,
      emailVerified: new Date(),
    });
    return userId;
  }

  async function createTestRole(userId: string, name: string) {
    const { roleCategories } = await import('@/db/schema/core');
    const [role] = await db
      .insert(roleCategories)
      .values({ userId, name, position: 0 })
      .returning();
    return role;
  }

  async function createTestDocument(userId: string) {
    const { documents } = await import('@/db/schema/core');
    const [doc] = await db
      .insert(documents)
      .values({
        userId,
        documentType: 'cv',
        fileName: 'test-resume.pdf',
        fileKey: `${userId}/test/cv/${crypto.randomUUID()}/v1/test-resume.pdf`,
        mimeType: 'application/pdf',
        fileSizeBytes: 1024,
        version: 1,
        isLatest: true,
      })
      .returning();
    return doc;
  }

  it('creates an application', async () => {
    const mod = await import('@/db');
    db = mod.db;
    const { applications } = await import('@/db/schema/applications');

    const userId = await createTestUser('create');

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'Acme Corp',
        jobTitle: 'Software Engineer',
        currentStatus: 'draft',
      })
      .returning();

    expect(app.id).toBeDefined();
    expect(app.companyName).toBe('Acme Corp');
    expect(app.jobTitle).toBe('Software Engineer');
    expect(app.currentStatus).toBe('draft');
    expect(app.userId).toBe(userId);
    expect(app.appliedAt).toBeNull();
  });

  it('creates application with role category', async () => {
    const { applications } = await import('@/db/schema/applications');
    const userId = await createTestUser('with-role');
    const role = await createTestRole(userId, 'Frontend Dev');

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'Globex',
        jobTitle: 'FE Engineer',
        roleCategoryId: role.id,
        currentStatus: 'applied',
        appliedAt: new Date(),
      })
      .returning();

    expect(app.roleCategoryId).toBe(role.id);
    expect(app.currentStatus).toBe('applied');
    expect(app.appliedAt).toBeInstanceOf(Date);
  });

  it('updates an application', async () => {
    const { applications } = await import('@/db/schema/applications');
    const userId = await createTestUser('update');

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'Original',
        jobTitle: 'Original Title',
        currentStatus: 'draft',
      })
      .returning();

    const [updated] = await db
      .update(applications)
      .set({ companyName: 'Updated Corp', jobTitle: 'Updated Title' })
      .where(
        and(
          eq(applications.id, app.id),
          eq(applications.userId, userId),
        ),
      )
      .returning();

    expect(updated.companyName).toBe('Updated Corp');
    expect(updated.jobTitle).toBe('Updated Title');
  });

  it('deletes an application', async () => {
    const { applications } = await import('@/db/schema/applications');
    const userId = await createTestUser('delete');

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'To Delete',
        jobTitle: 'Deletable',
        currentStatus: 'draft',
      })
      .returning();

    await db
      .delete(applications)
      .where(
        and(
          eq(applications.id, app.id),
          eq(applications.userId, userId),
        ),
      );

    const found = await db.query.applications.findFirst({
      where: eq(applications.id, app.id),
    });

    expect(found).toBeUndefined();
  });

  it('tracks status history lifecycle', async () => {
    const { applications, applicationStatusHistory } = await import(
      '@/db/schema/applications'
    );
    const userId = await createTestUser('history');

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'History Corp',
        jobTitle: 'Status Test',
        currentStatus: 'draft',
      })
      .returning();

    // Transition: draft -> applied
    await db.transaction(async (tx) => {
      await tx
        .update(applications)
        .set({ currentStatus: 'applied', appliedAt: new Date() })
        .where(eq(applications.id, app.id));
      await tx.insert(applicationStatusHistory).values({
        applicationId: app.id,
        fromStatus: 'draft',
        toStatus: 'applied',
      });
    });

    // Transition: applied -> interview
    await db.transaction(async (tx) => {
      await tx
        .update(applications)
        .set({ currentStatus: 'interview' })
        .where(eq(applications.id, app.id));
      await tx.insert(applicationStatusHistory).values({
        applicationId: app.id,
        fromStatus: 'applied',
        toStatus: 'interview',
      });
    });

    const history = await db
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, app.id));

    expect(history).toHaveLength(2);
    expect(history[0].fromStatus).toBe('draft');
    expect(history[0].toStatus).toBe('applied');
    expect(history[1].fromStatus).toBe('applied');
    expect(history[1].toStatus).toBe('interview');

    const [updatedApp] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, app.id));

    expect(updatedApp.currentStatus).toBe('interview');
    expect(updatedApp.appliedAt).toBeInstanceOf(Date);
  });

  it('links and unlinks documents', async () => {
    const { applications, applicationDocuments } = await import(
      '@/db/schema/applications'
    );
    const userId = await createTestUser('doc-link');
    const doc = await createTestDocument(userId);

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'DocLink Corp',
        jobTitle: 'Doc Test',
        currentStatus: 'applied',
      })
      .returning();

    // Link document
    await db.insert(applicationDocuments).values({
      applicationId: app.id,
      documentId: doc.id,
    });

    const links = await db
      .select()
      .from(applicationDocuments)
      .where(eq(applicationDocuments.applicationId, app.id));

    expect(links).toHaveLength(1);
    expect(links[0].documentId).toBe(doc.id);

    // Unlink document
    await db
      .delete(applicationDocuments)
      .where(
        and(
          eq(applicationDocuments.applicationId, app.id),
          eq(applicationDocuments.documentId, doc.id),
        ),
      );

    const linksAfter = await db
      .select()
      .from(applicationDocuments)
      .where(eq(applicationDocuments.applicationId, app.id));

    expect(linksAfter).toHaveLength(0);
  });

  it('prevents duplicate document links (composite PK)', async () => {
    const { applications, applicationDocuments } = await import(
      '@/db/schema/applications'
    );
    const userId = await createTestUser('dup-link');
    const doc = await createTestDocument(userId);

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'Dup Corp',
        jobTitle: 'Dup Test',
        currentStatus: 'draft',
      })
      .returning();

    await db.insert(applicationDocuments).values({
      applicationId: app.id,
      documentId: doc.id,
    });

    await expect(
      db.insert(applicationDocuments).values({
        applicationId: app.id,
        documentId: doc.id,
      }),
    ).rejects.toThrow();
  });

  it('cascades delete of application to history and document links', async () => {
    const { applications, applicationStatusHistory, applicationDocuments } =
      await import('@/db/schema/applications');
    const userId = await createTestUser('cascade');
    const doc = await createTestDocument(userId);

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'Cascade Corp',
        jobTitle: 'Cascade Test',
        currentStatus: 'draft',
      })
      .returning();

    await db.insert(applicationStatusHistory).values({
      applicationId: app.id,
      fromStatus: 'draft',
      toStatus: 'applied',
    });

    await db.insert(applicationDocuments).values({
      applicationId: app.id,
      documentId: doc.id,
    });

    // Delete the application
    await db.delete(applications).where(eq(applications.id, app.id));

    const history = await db
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, app.id));

    const docLinks = await db
      .select()
      .from(applicationDocuments)
      .where(eq(applicationDocuments.applicationId, app.id));

    expect(history).toHaveLength(0);
    expect(docLinks).toHaveLength(0);
  });

  it('sets roleCategoryId to null when role is deleted', async () => {
    const { applications } = await import('@/db/schema/applications');
    const { roleCategories } = await import('@/db/schema/core');
    const userId = await createTestUser('role-del');
    const role = await createTestRole(userId, 'Deletable Role');

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'RoleDel Corp',
        jobTitle: 'Role Del Test',
        roleCategoryId: role.id,
        currentStatus: 'applied',
      })
      .returning();

    expect(app.roleCategoryId).toBe(role.id);

    await db
      .delete(roleCategories)
      .where(eq(roleCategories.id, role.id));

    const [updated] = await db
      .select()
      .from(applications)
      .where(eq(applications.id, app.id));

    expect(updated.roleCategoryId).toBeNull();
    expect(updated.companyName).toBe('RoleDel Corp');
  });

  it('isolates data between users (multi-tenancy)', async () => {
    const { applications } = await import('@/db/schema/applications');
    const userId1 = await createTestUser('tenant1');
    const userId2 = await createTestUser('tenant2');

    await db.insert(applications).values({
      userId: userId1,
      companyName: 'User1 Company',
      jobTitle: 'User1 Job',
      currentStatus: 'draft',
    });

    await db.insert(applications).values({
      userId: userId2,
      companyName: 'User2 Company',
      jobTitle: 'User2 Job',
      currentStatus: 'applied',
    });

    const user1Apps = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId1));

    const user2Apps = await db
      .select()
      .from(applications)
      .where(eq(applications.userId, userId2));

    expect(user1Apps).toHaveLength(1);
    expect(user1Apps[0].companyName).toBe('User1 Company');
    expect(user2Apps).toHaveLength(1);
    expect(user2Apps[0].companyName).toBe('User2 Company');
  });

  it('cascades delete when user is deleted', async () => {
    const { users } = await import('@/db/schema/auth');
    const { applications, applicationStatusHistory, applicationDocuments } =
      await import('@/db/schema/applications');
    const userId = await createTestUser('user-cascade');
    const doc = await createTestDocument(userId);

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'User Cascade Corp',
        jobTitle: 'Cascade Test',
        currentStatus: 'applied',
      })
      .returning();

    await db.insert(applicationStatusHistory).values({
      applicationId: app.id,
      fromStatus: 'draft',
      toStatus: 'applied',
    });

    await db.insert(applicationDocuments).values({
      applicationId: app.id,
      documentId: doc.id,
    });

    // Delete the user
    await db.delete(users).where(eq(users.id, userId));
    const idx = testUserIds.indexOf(userId);
    if (idx !== -1) testUserIds.splice(idx, 1);

    const foundApp = await db.query.applications.findFirst({
      where: eq(applications.id, app.id),
    });
    const history = await db
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, app.id));
    const docLinks = await db
      .select()
      .from(applicationDocuments)
      .where(eq(applicationDocuments.applicationId, app.id));

    expect(foundApp).toBeUndefined();
    expect(history).toHaveLength(0);
    expect(docLinks).toHaveLength(0);
  });

  it('document deletion cascades to application document links', async () => {
    const { applications, applicationDocuments } = await import(
      '@/db/schema/applications'
    );
    const { documents } = await import('@/db/schema/core');
    const userId = await createTestUser('doc-cascade');
    const doc = await createTestDocument(userId);

    const [app] = await db
      .insert(applications)
      .values({
        userId,
        companyName: 'Doc Cascade Corp',
        jobTitle: 'Doc Cascade Test',
        currentStatus: 'applied',
      })
      .returning();

    await db.insert(applicationDocuments).values({
      applicationId: app.id,
      documentId: doc.id,
    });

    // Delete the document
    await db.delete(documents).where(eq(documents.id, doc.id));

    const links = await db
      .select()
      .from(applicationDocuments)
      .where(eq(applicationDocuments.applicationId, app.id));

    expect(links).toHaveLength(0);

    // Application should still exist
    const foundApp = await db.query.applications.findFirst({
      where: eq(applications.id, app.id),
    });
    expect(foundApp).toBeDefined();
  });
});
