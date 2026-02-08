import { NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { users, passwordResetTokens } from '@/db/schema/auth';
import { resetPasswordConfirmSchema } from '@/lib/auth/schemas';
import { hashPassword } from '@/lib/auth/password';
import { hashToken } from '@/lib/auth/tokens';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = resetPasswordConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const hashed = hashToken(parsed.data.token);

  const record = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, hashed),
      isNull(passwordResetTokens.usedAt),
    ),
  });

  if (!record) {
    return NextResponse.json(
      { error: 'Invalid or already used token' },
      { status: 400 },
    );
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: 'Token has expired' },
      { status: 400 },
    );
  }

  const newHashedPassword = await hashPassword(parsed.data.password);

  await db
    .update(users)
    .set({ hashedPassword: newHashedPassword })
    .where(eq(users.id, record.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, record.id));

  return NextResponse.json({ message: 'Password reset successfully' });
}
