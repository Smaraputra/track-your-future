import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { users, verificationTokens } from '@/db/schema/auth';
import { hashToken } from '@/lib/auth/tokens';

export async function verifyEmail(
  rawToken: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const hashed = hashToken(rawToken);

  const record = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.token, hashed),
  });

  if (!record) {
    return { success: false, error: 'Invalid or expired verification link.' };
  }

  if (record.expires < new Date()) {
    await db
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, record.identifier),
          eq(verificationTokens.token, hashed),
        ),
      );
    return { success: false, error: 'This verification link has expired. Please register again.' };
  }

  await db
    .update(users)
    .set({ emailVerified: new Date() })
    .where(eq(users.email, record.identifier));

  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, record.identifier),
        eq(verificationTokens.token, hashed),
      ),
    );

  return { success: true };
}
