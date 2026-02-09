import { and, asc, eq } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Form field templates CRUD integration', () => {
  let db: Awaited<typeof import('@/db')>['db'];
  const testUserIds: string[] = [];

  afterAll(async () => {
    if (!db) return;
    const { users } = await import('@/db/schema/auth');
    const { formFieldTemplates } = await import('@/db/schema/core');
    const { roleCategories } = await import('@/db/schema/core');
    for (const userId of testUserIds) {
      await db
        .delete(formFieldTemplates)
        .where(eq(formFieldTemplates.userId, userId));
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
      email: `templates-test-${suffix}-${userId}@example.com`,
      name: `Test User ${suffix}`,
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

  it('creates a form field template', async () => {
    const mod = await import('@/db');
    db = mod.db;
    const { formFieldTemplates } = await import('@/db/schema/core');

    const userId = await createTestUser('create');
    const role = await createTestRole(userId, 'Frontend Dev');

    const [template] = await db
      .insert(formFieldTemplates)
      .values({
        userId,
        roleCategoryId: role.id,
        fieldKey: 'Years of experience',
        fieldValue: '5 years in frontend development',
        position: 0,
      })
      .returning();

    expect(template.id).toBeDefined();
    expect(template.fieldKey).toBe('Years of experience');
    expect(template.fieldValue).toBe('5 years in frontend development');
    expect(template.position).toBe(0);
    expect(template.userId).toBe(userId);
    expect(template.roleCategoryId).toBe(role.id);
  });

  it('enforces unique (roleCategoryId, fieldKey) constraint', async () => {
    const { formFieldTemplates } = await import('@/db/schema/core');
    const userId = await createTestUser('unique');
    const role = await createTestRole(userId, 'Unique Test Role');

    await db.insert(formFieldTemplates).values({
      userId,
      roleCategoryId: role.id,
      fieldKey: 'Duplicate Key',
      fieldValue: 'first value',
      position: 0,
    });

    await expect(
      db.insert(formFieldTemplates).values({
        userId,
        roleCategoryId: role.id,
        fieldKey: 'Duplicate Key',
        fieldValue: 'second value',
        position: 1,
      }),
    ).rejects.toThrow();
  });

  it('allows same fieldKey in different roles', async () => {
    const { formFieldTemplates } = await import('@/db/schema/core');
    const userId = await createTestUser('samekey');
    const role1 = await createTestRole(userId, 'Role A');
    const role2 = await createTestRole(userId, 'Role B');

    await db.insert(formFieldTemplates).values({
      userId,
      roleCategoryId: role1.id,
      fieldKey: 'Shared Key',
      fieldValue: 'value in role A',
      position: 0,
    });

    const [template2] = await db
      .insert(formFieldTemplates)
      .values({
        userId,
        roleCategoryId: role2.id,
        fieldKey: 'Shared Key',
        fieldValue: 'value in role B',
        position: 0,
      })
      .returning();

    expect(template2.fieldKey).toBe('Shared Key');
    expect(template2.roleCategoryId).toBe(role2.id);
  });

  it('updates a template', async () => {
    const { formFieldTemplates } = await import('@/db/schema/core');
    const userId = await createTestUser('update');
    const role = await createTestRole(userId, 'Update Role');

    const [template] = await db
      .insert(formFieldTemplates)
      .values({
        userId,
        roleCategoryId: role.id,
        fieldKey: 'Original Key',
        fieldValue: 'Original value',
        position: 0,
      })
      .returning();

    const [updated] = await db
      .update(formFieldTemplates)
      .set({ fieldKey: 'Updated Key', fieldValue: 'Updated value' })
      .where(
        and(
          eq(formFieldTemplates.id, template.id),
          eq(formFieldTemplates.userId, userId),
        ),
      )
      .returning();

    expect(updated.fieldKey).toBe('Updated Key');
    expect(updated.fieldValue).toBe('Updated value');
  });

  it('deletes a template', async () => {
    const { formFieldTemplates } = await import('@/db/schema/core');
    const userId = await createTestUser('delete');
    const role = await createTestRole(userId, 'Delete Role');

    const [template] = await db
      .insert(formFieldTemplates)
      .values({
        userId,
        roleCategoryId: role.id,
        fieldKey: 'To Delete',
        fieldValue: 'Will be removed',
        position: 0,
      })
      .returning();

    await db
      .delete(formFieldTemplates)
      .where(
        and(
          eq(formFieldTemplates.id, template.id),
          eq(formFieldTemplates.userId, userId),
        ),
      );

    const found = await db.query.formFieldTemplates.findFirst({
      where: eq(formFieldTemplates.id, template.id),
    });

    expect(found).toBeUndefined();
  });

  it('reorders templates by position', async () => {
    const { formFieldTemplates } = await import('@/db/schema/core');
    const userId = await createTestUser('reorder');
    const role = await createTestRole(userId, 'Reorder Role');

    const [tplA] = await db
      .insert(formFieldTemplates)
      .values({
        userId,
        roleCategoryId: role.id,
        fieldKey: 'Field A',
        fieldValue: 'value A',
        position: 0,
      })
      .returning();

    const [tplB] = await db
      .insert(formFieldTemplates)
      .values({
        userId,
        roleCategoryId: role.id,
        fieldKey: 'Field B',
        fieldValue: 'value B',
        position: 1,
      })
      .returning();

    const [tplC] = await db
      .insert(formFieldTemplates)
      .values({
        userId,
        roleCategoryId: role.id,
        fieldKey: 'Field C',
        fieldValue: 'value C',
        position: 2,
      })
      .returning();

    // Reorder: C, A, B
    await db.transaction(async (tx) => {
      await tx
        .update(formFieldTemplates)
        .set({ position: 0 })
        .where(eq(formFieldTemplates.id, tplC.id));
      await tx
        .update(formFieldTemplates)
        .set({ position: 1 })
        .where(eq(formFieldTemplates.id, tplA.id));
      await tx
        .update(formFieldTemplates)
        .set({ position: 2 })
        .where(eq(formFieldTemplates.id, tplB.id));
    });

    const templates = await db
      .select()
      .from(formFieldTemplates)
      .where(eq(formFieldTemplates.roleCategoryId, role.id))
      .orderBy(asc(formFieldTemplates.position));

    expect(templates[0].fieldKey).toBe('Field C');
    expect(templates[1].fieldKey).toBe('Field A');
    expect(templates[2].fieldKey).toBe('Field B');
  });

  it('isolates data between users (multi-tenancy)', async () => {
    const { formFieldTemplates } = await import('@/db/schema/core');
    const userId1 = await createTestUser('tenant1');
    const userId2 = await createTestUser('tenant2');
    const role1 = await createTestRole(userId1, 'Tenant1 Role');
    const role2 = await createTestRole(userId2, 'Tenant2 Role');

    await db.insert(formFieldTemplates).values({
      userId: userId1,
      roleCategoryId: role1.id,
      fieldKey: 'User1 Key',
      fieldValue: 'User1 value',
      position: 0,
    });

    await db.insert(formFieldTemplates).values({
      userId: userId2,
      roleCategoryId: role2.id,
      fieldKey: 'User2 Key',
      fieldValue: 'User2 value',
      position: 0,
    });

    const user1Templates = await db
      .select()
      .from(formFieldTemplates)
      .where(eq(formFieldTemplates.userId, userId1));

    const user2Templates = await db
      .select()
      .from(formFieldTemplates)
      .where(eq(formFieldTemplates.userId, userId2));

    expect(user1Templates).toHaveLength(1);
    expect(user1Templates[0].fieldKey).toBe('User1 Key');
    expect(user2Templates).toHaveLength(1);
    expect(user2Templates[0].fieldKey).toBe('User2 Key');
  });

  it('cascades delete when role is deleted', async () => {
    const { roleCategories, formFieldTemplates } = await import(
      '@/db/schema/core'
    );
    const userId = await createTestUser('cascade-role');
    const role = await createTestRole(userId, 'Cascade Role');

    const [template] = await db
      .insert(formFieldTemplates)
      .values({
        userId,
        roleCategoryId: role.id,
        fieldKey: 'Cascade Test',
        fieldValue: 'Will cascade',
        position: 0,
      })
      .returning();

    // Delete the role -- should cascade to templates
    await db
      .delete(roleCategories)
      .where(eq(roleCategories.id, role.id));

    const found = await db.query.formFieldTemplates.findFirst({
      where: eq(formFieldTemplates.id, template.id),
    });

    expect(found).toBeUndefined();
  });

  it('cascades delete when user is deleted', async () => {
    const { users } = await import('@/db/schema/auth');
    const { formFieldTemplates } = await import('@/db/schema/core');
    const userId = await createTestUser('cascade-user');
    const role = await createTestRole(userId, 'User Cascade Role');

    const [template] = await db
      .insert(formFieldTemplates)
      .values({
        userId,
        roleCategoryId: role.id,
        fieldKey: 'User Cascade Test',
        fieldValue: 'Will cascade with user',
        position: 0,
      })
      .returning();

    // Delete the user -- should cascade
    await db.delete(users).where(eq(users.id, userId));
    // Remove from cleanup list since already deleted
    const idx = testUserIds.indexOf(userId);
    if (idx !== -1) testUserIds.splice(idx, 1);

    const found = await db.query.formFieldTemplates.findFirst({
      where: eq(formFieldTemplates.id, template.id),
    });

    expect(found).toBeUndefined();
  });
});
