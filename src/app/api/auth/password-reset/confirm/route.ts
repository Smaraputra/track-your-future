import { type NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull } from 'drizzle-orm';

import { db } from '@/db';
import { passwordResetTokens, sessions, users } from '@/db/schema/auth';
import { getClientIp } from '@/lib/auth/get-ip';
import { hashPassword } from '@/lib/auth/password';
import {
  hashResetToken,
  isResetTokenExpired,
} from '@/lib/auth/password-reset';
import { passwordResetConfirmSchema } from '@/lib/auth/schemas';
import { invalidateUserSessions } from '@/lib/auth/session-invalidation';
import { checkRateLimit } from '@/lib/rate-limit';
import { PASSWORD_RESET_CONFIRM_LIMIT } from '@/lib/rate-limit-configs';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = await checkRateLimit(
    `pw-reset-confirm:ip:${ip}`,
    PASSWORD_RESET_CONFIRM_LIMIT,
  );
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = passwordResetConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link.' },
      { status: 400 },
    );
  }

  const tokenHash = hashResetToken(parsed.data.token);

  const record = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, tokenHash),
  });

  if (!record || record.usedAt || isResetTokenExpired(record.expiresAt)) {
    return NextResponse.json(
      { error: 'Invalid or expired reset link.' },
      { status: 400 },
    );
  }

  const newHashedPassword = await hashPassword(parsed.data.newPassword);
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ hashedPassword: newHashedPassword, passwordChangedAt: now })
      .where(eq(users.id, record.userId));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, record.id));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.userId, record.userId),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    await tx.delete(sessions).where(eq(sessions.userId, record.userId));
  });

  await invalidateUserSessions(record.userId);

  return NextResponse.json({ success: true });
}
