import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { getBillingProvider } from '@/lib/billing/provider';
import { db } from '@/db';
import { subscriptions } from '@/db/schema/billing';

export async function POST() {
  const provider = await getBillingProvider();
  if (!provider) {
    return NextResponse.json(
      { error: 'Billing not configured' },
      { status: 503 },
    );
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
    columns: { providerCustomerId: true },
  });

  if (!sub?.providerCustomerId) {
    return NextResponse.json(
      { error: 'No billing account found' },
      { status: 404 },
    );
  }

  const result = await provider.createPortalSession({
    providerCustomerId: sub.providerCustomerId,
  });

  return NextResponse.json({ url: result.url });
}
