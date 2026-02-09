import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { stripe } from '@/lib/billing/stripe';
import { PRICES } from '@/lib/billing/plans';
import { db } from '@/db';
import { subscriptions } from '@/db/schema/billing';
import { users } from '@/db/schema/auth';

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

  const userId = session.user.id;

  // Check for existing subscription
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
    columns: {
      status: true,
      trialEnd: true,
    },
  });

  if (
    existing &&
    ['active', 'trialing'].includes(existing.status)
  ) {
    return NextResponse.json(
      { error: 'You already have an active subscription' },
      { status: 409 },
    );
  }

  // Prevent re-trial: if user had a previous trial, block
  if (existing?.trialEnd) {
    return NextResponse.json(
      { error: 'Trial already used. Subscribe to continue with Pro.' },
      { status: 409 },
    );
  }

  // Get user email for customer creation
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true, name: true },
  });

  // Create Stripe customer
  const customer = await stripe.customers.create({
    email: user?.email ?? undefined,
    name: user?.name ?? undefined,
    metadata: { userId },
  });

  // Create subscription with no-CC trial
  const sub = await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: PRICES.monthly.priceId }],
    trial_period_days: PRICES.trialDays,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel',
      },
    },
    metadata: { userId },
  });

  const item = sub.items.data[0];

  // Insert local subscription row
  await db.insert(subscriptions).values({
    userId,
    provider: 'stripe',
    providerCustomerId: customer.id,
    providerSubscriptionId: sub.id,
    providerPriceId: item?.price?.id ?? null,
    tier: 'pro',
    status: 'trialing',
    currentPeriodStart: item
      ? new Date(item.current_period_start * 1000)
      : null,
    currentPeriodEnd: item
      ? new Date(item.current_period_end * 1000)
      : null,
    trialStart: sub.trial_start
      ? new Date(sub.trial_start * 1000)
      : null,
    trialEnd: sub.trial_end
      ? new Date(sub.trial_end * 1000)
      : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  });

  return NextResponse.json(
    { message: 'Trial started successfully' },
    { status: 201 },
  );
}
