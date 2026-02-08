import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { subscriptions } from '@/db/schema/billing';

const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT'),
});

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = deleteAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          'Confirmation required. Send { "confirmation": "DELETE MY ACCOUNT" }',
      },
      { status: 400 },
    );
  }

  // TODO: Query documents.fileKey for this user and delete from MinIO/S3 when SDK is installed

  // Check for active Stripe subscription
  const userSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { providerSubscriptionId: true, status: true },
  });
  if (userSubscription?.providerSubscriptionId && userSubscription.status === 'active') {
    // TODO: Cancel Stripe subscription when SDK is installed
  }

  // Delete user -- cascades all related data
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json(
    { message: 'Account deleted successfully' },
    { status: 200 },
  );
}
