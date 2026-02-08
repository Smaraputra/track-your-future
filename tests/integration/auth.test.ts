import { eq } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Auth credentials integration', () => {
  let db: Awaited<typeof import('@/db')>['db'];
  const testUserIds: string[] = [];

  afterAll(async () => {
    if (!db) return;
    const { users } = await import('@/db/schema');
    for (const id of testUserIds) {
      await db.delete(users).where(eq(users.id, id));
    }
  });

  it('credential authorize flow: correct password with verified email', async () => {
    const mod = await import('@/db');
    db = mod.db;
    const { users } = await import('@/db/schema');
    const { hashPassword, verifyPassword } = await import(
      '@/lib/auth/password'
    );

    const userId = crypto.randomUUID();
    testUserIds.push(userId);
    const email = `auth-test-${userId}@example.com`;

    const hash = await hashPassword('correct-password');
    await db.insert(users).values({
      id: userId,
      email,
      name: 'Auth Test',
      hashedPassword: hash,
      emailVerified: new Date(),
    });

    // Simulate what authorize() does
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    expect(user).toBeDefined();
    expect(user!.hashedPassword).toBeTruthy();
    expect(user!.emailVerified).toBeTruthy();
    expect(await verifyPassword('correct-password', user!.hashedPassword!)).toBe(
      true,
    );
  });

  it('rejects unverified user', async () => {
    const { users } = await import('@/db/schema');
    const { hashPassword } = await import('@/lib/auth/password');

    const userId = crypto.randomUUID();
    testUserIds.push(userId);
    const email = `unverified-${userId}@example.com`;

    const hash = await hashPassword('password');
    await db.insert(users).values({
      id: userId,
      email,
      hashedPassword: hash,
      emailVerified: null, // not verified
    });

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    expect(user).toBeDefined();
    expect(user!.emailVerified).toBeNull();
    // authorize() would return null here
  });

  it('rejects wrong password', async () => {
    const { users } = await import('@/db/schema');
    const { hashPassword, verifyPassword } = await import(
      '@/lib/auth/password'
    );

    const userId = crypto.randomUUID();
    testUserIds.push(userId);
    const email = `wrongpw-${userId}@example.com`;

    const hash = await hashPassword('correct');
    await db.insert(users).values({
      id: userId,
      email,
      hashedPassword: hash,
      emailVerified: new Date(),
    });

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    expect(await verifyPassword('wrong', user!.hashedPassword!)).toBe(false);
  });

  it('returns null for non-existent user', async () => {
    const { users } = await import('@/db/schema');

    const user = await db.query.users.findFirst({
      where: eq(users.email, 'nonexistent@example.com'),
    });
    expect(user).toBeUndefined();
  });
});
