import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { invalidateUserSessions } from '@/lib/auth/session-invalidation';
import { logAuditEvent } from '@/lib/audit/log';
import { checkRateLimit } from '@/lib/rate-limit';
import { PASSWORD_CHANGE_LIMIT } from '@/lib/rate-limit-configs';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = await checkRateLimit(`password-change:${session.user.id}`, PASSWORD_CHANGE_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { hashedPassword: true },
  });

  if (!user?.hashedPassword) {
    return NextResponse.json(
      { error: 'Password login not available for this account' },
      { status: 400 },
    );
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.hashedPassword);
  if (!valid) {
    return NextResponse.json(
      { error: 'Current password is incorrect' },
      { status: 400 },
    );
  }

  const hashed = await hashPassword(parsed.data.newPassword);
  await db
    .update(users)
    .set({ hashedPassword: hashed, passwordChangedAt: new Date() })
    .where(eq(users.id, session.user.id));

  await invalidateUserSessions(session.user.id);

  await logAuditEvent({
    action: 'password_changed',
    userId: session.user.id,
    request,
  });

  return NextResponse.json({ success: true });
}
