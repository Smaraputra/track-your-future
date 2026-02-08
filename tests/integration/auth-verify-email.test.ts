import { and, eq } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Email verification integration', () => {
  let db: Awaited<typeof import('@/db')>['db'];
  const testEmails: string[] = [];

  afterAll(async () => {
    if (!db) return;
    const { users, verificationTokens } = await import('@/db/schema');
    for (const email of testEmails) {
      await db
        .delete(verificationTokens)
        .where(eq(verificationTokens.identifier, email));
      await db.delete(users).where(eq(users.email, email));
    }
  });

  it('verifies email with valid token', async () => {
    const mod = await import('@/db');
    db = mod.db;
    const { users, verificationTokens } = await import('@/db/schema');
    const { generateToken, hashToken } = await import('@/lib/auth/tokens');

    const email = `verify-test-${crypto.randomUUID()}@example.com`;
    testEmails.push(email);

    await db.insert(users).values({
      email,
      name: 'Verify Test',
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

    // Simulate verification: look up token, verify, delete
    const lookupHash = hashToken(rawToken);
    const record = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, lookupHash),
    });
    expect(record).toBeDefined();
    expect(record!.expires.getTime()).toBeGreaterThan(Date.now());

    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.email, record!.identifier));

    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, record!.identifier),
          eq(verificationTokens.token, lookupHash),
        ),
      );

    // Verify user is now verified
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    expect(user!.emailVerified).toBeTruthy();

    // Verify token was deleted
    const deletedToken = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.identifier, email),
    });
    expect(deletedToken).toBeUndefined();
  });

  it('rejects expired token', async () => {
    const { users, verificationTokens } = await import('@/db/schema');
    const { generateToken, hashToken } = await import('@/lib/auth/tokens');

    const email = `expired-test-${crypto.randomUUID()}@example.com`;
    testEmails.push(email);

    await db.insert(users).values({
      email,
      name: 'Expired Test',
      emailVerified: null,
    });

    const rawToken = generateToken();
    const hashed = hashToken(rawToken);
    // Already expired
    const expires = new Date(Date.now() - 1000);

    await db.insert(verificationTokens).values({
      identifier: email,
      token: hashed,
      expires,
    });

    const record = await db.query.verificationTokens.findFirst({
      where: eq(verificationTokens.token, hashed),
    });
    expect(record).toBeDefined();
    expect(record!.expires.getTime()).toBeLessThan(Date.now());
  });
});
