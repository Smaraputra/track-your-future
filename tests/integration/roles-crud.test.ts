import { and, asc, eq } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Role categories CRUD integration', () => {
  let db: Awaited<typeof import('@/db')>['db'];
  const testUserIds: string[] = [];

  afterAll(async () => {
    if (!db) return;
    const { users } = await import('@/db/schema/auth');
    const { roleCategories } = await import('@/db/schema/core');
    // Clean up role categories first, then users
    for (const userId of testUserIds) {
      await db.delete(roleCategories).where(eq(roleCategories.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  async function createTestUser(suffix: string) {
    const { users } = await import('@/db/schema/auth');
    const userId = crypto.randomUUID();
    testUserIds.push(userId);
    await db.insert(users).values({
      id: userId,
      email: `roles-test-${suffix}-${userId}@example.com`,
      name: `Test User ${suffix}`,
      emailVerified: new Date(),
    });
    return userId;
  }

  it('creates a role category', async () => {
    const mod = await import('@/db');
    db = mod.db;
    const { roleCategories } = await import('@/db/schema/core');

    const userId = await createTestUser('create');

    const [role] = await db
      .insert(roleCategories)
      .values({
        userId,
        name: 'Frontend Developer',
        description: 'Frontend engineering roles',
        color: '#22c55e',
        position: 0,
      })
      .returning();

    expect(role.id).toBeDefined();
    expect(role.name).toBe('Frontend Developer');
    expect(role.description).toBe('Frontend engineering roles');
    expect(role.color).toBe('#22c55e');
    expect(role.position).toBe(0);
    expect(role.userId).toBe(userId);
  });

  it('enforces unique (userId, name) constraint', async () => {
    const { roleCategories } = await import('@/db/schema/core');
    const userId = await createTestUser('unique');

    await db.insert(roleCategories).values({
      userId,
      name: 'Duplicate Test',
      position: 0,
    });

    await expect(
      db.insert(roleCategories).values({
        userId,
        name: 'Duplicate Test',
        position: 1,
      }),
    ).rejects.toThrow();
  });

  it('allows same name for different users', async () => {
    const { roleCategories } = await import('@/db/schema/core');
    const userId1 = await createTestUser('samename1');
    const userId2 = await createTestUser('samename2');

    await db.insert(roleCategories).values({
      userId: userId1,
      name: 'Shared Name',
      position: 0,
    });

    const [role2] = await db
      .insert(roleCategories)
      .values({
        userId: userId2,
        name: 'Shared Name',
        position: 0,
      })
      .returning();

    expect(role2.name).toBe('Shared Name');
    expect(role2.userId).toBe(userId2);
  });

  it('updates a role category', async () => {
    const { roleCategories } = await import('@/db/schema/core');
    const userId = await createTestUser('update');

    const [role] = await db
      .insert(roleCategories)
      .values({
        userId,
        name: 'Original Name',
        color: '#22c55e',
        position: 0,
      })
      .returning();

    const [updated] = await db
      .update(roleCategories)
      .set({ name: 'Updated Name', color: '#ef4444' })
      .where(
        and(
          eq(roleCategories.id, role.id),
          eq(roleCategories.userId, userId),
        ),
      )
      .returning();

    expect(updated.name).toBe('Updated Name');
    expect(updated.color).toBe('#ef4444');
  });

  it('deletes a role category', async () => {
    const { roleCategories } = await import('@/db/schema/core');
    const userId = await createTestUser('delete');

    const [role] = await db
      .insert(roleCategories)
      .values({
        userId,
        name: 'To Delete',
        position: 0,
      })
      .returning();

    await db
      .delete(roleCategories)
      .where(
        and(
          eq(roleCategories.id, role.id),
          eq(roleCategories.userId, userId),
        ),
      );

    const found = await db.query.roleCategories.findFirst({
      where: eq(roleCategories.id, role.id),
    });

    expect(found).toBeUndefined();
  });

  it('reorders role categories by position', async () => {
    const { roleCategories } = await import('@/db/schema/core');
    const userId = await createTestUser('reorder');

    const [roleA] = await db
      .insert(roleCategories)
      .values({ userId, name: 'Role A', position: 0 })
      .returning();

    const [roleB] = await db
      .insert(roleCategories)
      .values({ userId, name: 'Role B', position: 1 })
      .returning();

    const [roleC] = await db
      .insert(roleCategories)
      .values({ userId, name: 'Role C', position: 2 })
      .returning();

    // Reorder: C, A, B
    await db.transaction(async (tx) => {
      await tx
        .update(roleCategories)
        .set({ position: 0 })
        .where(eq(roleCategories.id, roleC.id));
      await tx
        .update(roleCategories)
        .set({ position: 1 })
        .where(eq(roleCategories.id, roleA.id));
      await tx
        .update(roleCategories)
        .set({ position: 2 })
        .where(eq(roleCategories.id, roleB.id));
    });

    const roles = await db
      .select()
      .from(roleCategories)
      .where(eq(roleCategories.userId, userId))
      .orderBy(asc(roleCategories.position));

    expect(roles[0].name).toBe('Role C');
    expect(roles[1].name).toBe('Role A');
    expect(roles[2].name).toBe('Role B');
  });

  it('isolates data between users (multi-tenancy)', async () => {
    const { roleCategories } = await import('@/db/schema/core');
    const userId1 = await createTestUser('tenant1');
    const userId2 = await createTestUser('tenant2');

    await db.insert(roleCategories).values({
      userId: userId1,
      name: 'User1 Role',
      position: 0,
    });

    await db.insert(roleCategories).values({
      userId: userId2,
      name: 'User2 Role',
      position: 0,
    });

    const user1Roles = await db
      .select()
      .from(roleCategories)
      .where(eq(roleCategories.userId, userId1));

    const user2Roles = await db
      .select()
      .from(roleCategories)
      .where(eq(roleCategories.userId, userId2));

    expect(user1Roles).toHaveLength(1);
    expect(user1Roles[0].name).toBe('User1 Role');
    expect(user2Roles).toHaveLength(1);
    expect(user2Roles[0].name).toBe('User2 Role');
  });

  it('cascades delete when user is deleted', async () => {
    const { users } = await import('@/db/schema/auth');
    const { roleCategories } = await import('@/db/schema/core');
    const userId = await createTestUser('cascade');

    const [role] = await db
      .insert(roleCategories)
      .values({ userId, name: 'Cascade Test', position: 0 })
      .returning();

    // Delete the user -- should cascade
    await db.delete(users).where(eq(users.id, userId));
    // Remove from cleanup list since already deleted
    const idx = testUserIds.indexOf(userId);
    if (idx !== -1) testUserIds.splice(idx, 1);

    const found = await db.query.roleCategories.findFirst({
      where: eq(roleCategories.id, role.id),
    });

    expect(found).toBeUndefined();
  });
});
