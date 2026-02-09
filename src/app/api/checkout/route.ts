import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { auth } from '@/auth';
import { stripe } from '@/lib/billing/stripe';
import { PRICES } from '@/lib/billing/plans';
import { db } from '@/db';
import { subscriptions } from '@/db/schema/billing';
import { users } from '@/db/schema/auth';

const checkoutSchema = z.object({
  interval: z.enum(['monthly', 'annual']),
});

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Check for existing active subscription
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
    columns: { status: true },
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

  // Get or create Stripe customer
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { email: true, name: true },
  });

  let customerId: string | undefined;

  if (existing) {
    const subRow = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, session.user.id),
      columns: { providerCustomerId: true },
    });
    customerId = subRow?.providerCustomerId ?? undefined;
  }

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user?.email ?? undefined,
      name: user?.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
  }

  const priceId =
    parsed.data.interval === 'monthly'
      ? PRICES.monthly.priceId
      : PRICES.annual.priceId;

  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: session.user.id,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/settings?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    subscription_data: {
      trial_period_days: PRICES.trialDays,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
