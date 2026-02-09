import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { stripe } from '@/lib/billing/stripe';
import { db } from '@/db';
import { subscriptions } from '@/db/schema/billing';

export async function POST() {
  if (!stripe) {
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

  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.providerCustomerId,
    return_url: `${baseUrl}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
