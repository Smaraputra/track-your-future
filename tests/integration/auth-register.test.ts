import { eq } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Registration integration', () => {
  let db: Awaited<typeof import('@/db')>['db'];
  const testEmails: string[] = [];

  afterAll(async () => {
    if (!db) return;
    const { users } = await import('@/db/schema');
    for (const email of testEmails) {
      await db.delete(users).where(eq(users.email, email));
    }
  });

  it('registers a new user and creates verification token', async () => {
    const mod = await import('@/db');
    db = mod.db;
    const { users, verificationTokens } = await import('@/db/schema');
    const { hashPassword } = await import('@/lib/auth/password');
    const { generateToken, hashToken } = await import('@/lib/auth/tokens');

    const email = `register-test-${crypto.randomUUID()}@example.com`;
    testEmails.push(email);

    const hashedPw = await hashPassword('test-password-123');

    await db.insert(users).values({
      name: 'Register Test',
      email,
      hashedPassword: hashedPw,
      emailVerified: null,
    });

    const rawToken = generateToken();
    const hashed = hashToken(rawToken);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(verificationTokens).values({
      identifier: email,
      token: hashed,
      expires,
    });

    // Verify user was created
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    expect(user).toBeDefined();
    expect(user!.name).toBe('Register Test');
    expect(user!.emailVerified).toBeNull();
    expect(user!.hashedPassword).toBeTruthy();

    // Verify token was created
    const token = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.identifier, email),
    });
    expect(token).toBeDefined();
    expect(token!.token).toBe(hashed);

    // Clean up token
    await db
      .delete(verificationTokens)
      .where(eq(verificationTokens.identifier, email));
  });

  it('rejects duplicate email', async () => {
    const { users } = await import('@/db/schema');

    const email = `dup-test-${crypto.randomUUID()}@example.com`;
    testEmails.push(email);

    await db.insert(users).values({ email, name: 'First' });

    await expect(
      db.insert(users).values({ email, name: 'Second' }),
    ).rejects.toThrow();
  });

  it('password hashing and verification roundtrips', async () => {
    const { hashPassword, verifyPassword } = await import(
      '@/lib/auth/password'
    );

    const pw = 'my-secure-password!';
    const hash = await hashPassword(pw);
    expect(await verifyPassword(pw, hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });
});
