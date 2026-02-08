import { eq, sql } from 'drizzle-orm';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Database schema integration', () => {
  let db: Awaited<typeof import('@/db')>['db'];

  beforeAll(async () => {
    const mod = await import('@/db');
    db = mod.db;
  });

  describe('tables exist', () => {
    const expectedTables = [
      'users',
      'accounts',
      'sessions',
      'verification_tokens',
      'password_reset_tokens',
      'role_categories',
      'documents',
      'form_field_templates',
      'applications',
      'application_status_history',
      'application_documents',
      'subscriptions',
      'webhook_events',
      'payments',
      'parsed_profiles',
      'job_analyses',
      'ai_usage',
      'notifications',
    ];

    it('has all 18 tables', async () => {
      const result = await db.execute(sql`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      const tableNames = result.map((r) => r.table_name);
      for (const table of expectedTables) {
        expect(tableNames).toContain(table);
      }
    });
  });

  describe('enum types exist', () => {
    const expectedEnums = [
      'ai_feature',
      'application_status',
      'document_type',
      'notification_type',
      'subscription_status',
      'subscription_tier',
    ];

    it('has all 6 enum types', async () => {
      const result = await db.execute(sql`
        SELECT typname FROM pg_type
        WHERE typtype = 'e' AND typnamespace = (
          SELECT oid FROM pg_namespace WHERE nspname = 'public'
        )
        ORDER BY typname
      `);
      const enumNames = result.map((r) => r.typname);
      for (const e of expectedEnums) {
        expect(enumNames).toContain(e);
      }
    });
  });

  describe('UUID primary keys', () => {
    it('users table uses UUID primary key', async () => {
      const result = await db.execute(sql`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'id'
      `);
      expect(result[0].data_type).toBe('uuid');
    });
  });

  describe('CRUD operations', () => {
    const testUserId = crypto.randomUUID();

    afterAll(async () => {
      const { users } = await import('@/db/schema');
      await db.delete(users).where(eq(users.id, testUserId));
    });

    it('inserts and reads a user', async () => {
      const { users } = await import('@/db/schema');
      await db.insert(users).values({
        id: testUserId,
        email: `test-${testUserId}@example.com`,
        name: 'Test User',
      });

      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId));
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe(`test-${testUserId}@example.com`);
      expect(result[0].name).toBe('Test User');
      expect(result[0].id).toBe(testUserId);
    });

    it('enforces unique email constraint', async () => {
      const { users } = await import('@/db/schema');
      await expect(
        db.insert(users).values({
          email: `test-${testUserId}@example.com`,
          name: 'Duplicate',
        }),
      ).rejects.toThrow();
    });
  });

  describe('foreign key constraints', () => {
    it('rejects insert with non-existent foreign key', async () => {
      const { roleCategories } = await import('@/db/schema');
      const fakeUserId = crypto.randomUUID();
      await expect(
        db.insert(roleCategories).values({
          userId: fakeUserId,
          name: 'Should Fail',
        }),
      ).rejects.toThrow();
    });
  });

  describe('cascade delete', () => {
    it('deleting a user cascades to role_categories', async () => {
      const { users, roleCategories } = await import('@/db/schema');
      const userId = crypto.randomUUID();

      await db.insert(users).values({
        id: userId,
        email: `cascade-test-${userId}@example.com`,
      });

      await db.insert(roleCategories).values({
        userId,
        name: 'Test Role',
      });

      // Verify role exists
      const before = await db
        .select()
        .from(roleCategories)
        .where(eq(roleCategories.userId, userId));
      expect(before).toHaveLength(1);

      // Delete user
      await db.delete(users).where(eq(users.id, userId));

      // Verify cascade
      const after = await db
        .select()
        .from(roleCategories)
        .where(eq(roleCategories.userId, userId));
      expect(after).toHaveLength(0);
    });
  });

  describe('composite primary keys', () => {
    it('application_documents has composite PK', async () => {
      const result = await db.execute(sql`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_name = 'application_documents'
          AND tc.constraint_type = 'PRIMARY KEY'
        ORDER BY kcu.ordinal_position
      `);
      const columns = result.map((r) => r.column_name);
      expect(columns).toEqual(['application_id', 'document_id']);
    });
  });

  describe('JSONB columns', () => {
    it('webhook_events accepts and returns JSON objects', async () => {
      const { webhookEvents } = await import('@/db/schema');
      const id = crypto.randomUUID();
      const payload = { type: 'test', data: { amount: 100, nested: true } };

      await db.insert(webhookEvents).values({
        id,
        provider: 'test',
        eventId: `evt-${id}`,
        eventType: 'test.event',
        payload,
      });

      const result = await db
        .select()
        .from(webhookEvents)
        .where(eq(webhookEvents.id, id));
      expect(result[0].payload).toEqual(payload);

      // Clean up
      await db.delete(webhookEvents).where(eq(webhookEvents.id, id));
    });
  });

  describe('enum columns', () => {
    it('application_status enum enforces valid values', async () => {
      // Attempt to insert an invalid enum value via raw SQL
      await expect(
        db.execute(sql`
          INSERT INTO applications (id, user_id, company_name, job_title, current_status)
          VALUES (gen_random_uuid(), gen_random_uuid(), 'Test', 'Test', 'invalid_status')
        `),
      ).rejects.toThrow();
    });
  });

  describe('default values', () => {
    it('applications default status is draft', async () => {
      const { users, applications } = await import('@/db/schema');
      const userId = crypto.randomUUID();

      await db.insert(users).values({
        id: userId,
        email: `defaults-${userId}@example.com`,
      });

      const appId = crypto.randomUUID();
      await db.insert(applications).values({
        id: appId,
        userId,
        companyName: 'Test Co',
        jobTitle: 'Engineer',
      });

      const result = await db
        .select()
        .from(applications)
        .where(eq(applications.id, appId));
      expect(result[0].currentStatus).toBe('draft');

      // Clean up (cascade from user delete)
      await db.delete(users).where(eq(users.id, userId));
    });
  });

  describe('set null on delete', () => {
    it('deleting a role_category sets applications.roleCategoryId to null', async () => {
      const { users, roleCategories, applications } = await import(
        '@/db/schema'
      );
      const userId = crypto.randomUUID();

      await db.insert(users).values({
        id: userId,
        email: `setnull-${userId}@example.com`,
      });

      const roleId = crypto.randomUUID();
      await db.insert(roleCategories).values({
        id: roleId,
        userId,
        name: 'To Delete',
      });

      const appId = crypto.randomUUID();
      await db.insert(applications).values({
        id: appId,
        userId,
        roleCategoryId: roleId,
        companyName: 'Test Co',
        jobTitle: 'Dev',
      });

      // Delete role category
      await db.delete(roleCategories).where(eq(roleCategories.id, roleId));

      // Application should still exist but roleCategoryId should be null
      const result = await db
        .select()
        .from(applications)
        .where(eq(applications.id, appId));
      expect(result).toHaveLength(1);
      expect(result[0].roleCategoryId).toBeNull();

      // Clean up
      await db.delete(users).where(eq(users.id, userId));
    });
  });
});
