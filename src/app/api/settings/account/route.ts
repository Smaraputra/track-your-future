import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { documents } from '@/db/schema/core';
import { subscriptions } from '@/db/schema/billing';
import { deleteObjects } from '@/lib/minio/presign';

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

  // Delete all user files from MinIO
  const userDocs = await db
    .select({ fileKey: documents.fileKey })
    .from(documents)
    .where(eq(documents.userId, userId));

  if (userDocs.length > 0) {
    await deleteObjects(userDocs.map((d) => d.fileKey));
  }

  // Cancel active subscription if exists
  const userSubscription = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: { providerSubscriptionId: true, status: true },
  });
  if (
    userSubscription?.providerSubscriptionId &&
    ['active', 'trialing', 'past_due'].includes(userSubscription.status)
  ) {
    const { getBillingProvider } = await import('@/lib/billing/provider');
    const provider = await getBillingProvider();
    if (provider) {
      await provider.cancelSubscription({
        providerSubscriptionId: userSubscription.providerSubscriptionId,
      });
    }
  }

  // Delete user -- cascades all related data
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json(
    { message: 'Account deleted successfully' },
    { status: 200 },
  );
}
