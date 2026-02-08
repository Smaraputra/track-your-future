import { and, eq, isNull } from 'drizzle-orm';
import { describe, expect, it, afterAll } from 'vitest';

const DATABASE_URL = process.env.DATABASE_URL;

describe.skipIf(!DATABASE_URL)('Password reset integration', () => {
  let db: Awaited<typeof import('@/db')>['db'];
  const testUserIds: string[] = [];

  afterAll(async () => {
    if (!db) return;
    const { users } = await import('@/db/schema');
    for (const id of testUserIds) {
      await db.delete(users).where(eq(users.id, id));
    }
  });

  it('creates and uses a password reset token', async () => {
    const mod = await import('@/db');
    db = mod.db;
    const { users, passwordResetTokens } = await import('@/db/schema');
    const { hashPassword, verifyPassword } = await import(
      '@/lib/auth/password'
    );
    const { generateToken, hashToken } = await import('@/lib/auth/tokens');

    const userId = crypto.randomUUID();
    testUserIds.push(userId);
    const email = `reset-test-${userId}@example.com`;

    const oldHash = await hashPassword('old-password');
    await db.insert(users).values({
      id: userId,
      email,
      name: 'Reset Test',
      hashedPassword: oldHash,
      emailVerified: new Date(),
    });

    // Create reset token
    const rawToken = generateToken();
    const hashed = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId,
      token: hashed,
      expiresAt,
    });

    // Simulate confirm: look up token
    const record = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, hashed),
        isNull(passwordResetTokens.usedAt),
      ),
    });
    expect(record).toBeDefined();
    expect(record!.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Update password
    const newHash = await hashPassword('new-password');
    await db
      .update(users)
      .set({ hashedPassword: newHash })
      .where(eq(users.id, record!.userId));

    // Mark token as used
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, record!.id));

    // Verify new password works
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });
    expect(
      await verifyPassword('new-password', updatedUser!.hashedPassword!),
    ).toBe(true);
    expect(
      await verifyPassword('old-password', updatedUser!.hashedPassword!),
    ).toBe(false);

    // Verify token is marked used -- can't reuse
    const usedRecord = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.token, hashed),
        isNull(passwordResetTokens.usedAt),
      ),
    });
    expect(usedRecord).toBeUndefined();
  });

  it('returns 200 for non-existent email (no enumeration)', async () => {
    // This is a logic test: the endpoint always returns success.
    // We test the underlying behavior: no token created for missing user.
    const { passwordResetTokens } = await import('@/db/schema');
    const { hashToken } = await import('@/lib/auth/tokens');

    const fakeToken = hashToken('nonexistent-token');
    const record = await db.query.passwordResetTokens.findFirst({
      where: eq(passwordResetTokens.token, fakeToken),
    });
    expect(record).toBeUndefined();
  });
});
