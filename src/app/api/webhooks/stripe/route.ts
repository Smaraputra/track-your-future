import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

import { stripe } from '@/lib/billing/stripe';
import { db } from '@/db';
import { subscriptions, webhookEvents, payments } from '@/db/schema/billing';
import { users } from '@/db/schema/auth';
import { sendTrialEndingEmail } from '@/lib/email';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'paused';

function mapStripeStatus(status: string): SubscriptionStatus {
  const mapping: Record<string, SubscriptionStatus> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    paused: 'paused',
  };
  return mapping[status] ?? 'canceled';
}

function toDate(ts: number | null | undefined): Date | null {
  if (!ts) return null;
  return new Date(ts * 1000);
}

function getItemPeriod(sub: Stripe.Subscription) {
  const item = sub.items.data[0];
  return {
    start: item ? toDate(item.current_period_start) : null,
    end: item ? toDate(item.current_period_end) : null,
  };
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const userId = session.client_reference_id;
  if (!userId) return;

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;
  if (!subscriptionId || !stripe) return;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  const period = getItemPeriod(sub);

  await db
    .insert(subscriptions)
    .values({
      userId,
      provider: 'stripe',
      providerCustomerId: customerId ?? null,
      providerSubscriptionId: sub.id,
      providerPriceId: sub.items.data[0]?.price?.id ?? null,
      tier: 'pro',
      status: mapStripeStatus(sub.status),
      currentPeriodStart: period.start,
      currentPeriodEnd: period.end,
      trialStart: toDate(sub.trial_start),
      trialEnd: toDate(sub.trial_end),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        providerCustomerId: customerId ?? null,
        providerSubscriptionId: sub.id,
        providerPriceId: sub.items.data[0]?.price?.id ?? null,
        tier: 'pro',
        status: mapStripeStatus(sub.status),
        currentPeriodStart: period.start,
        currentPeriodEnd: period.end,
        trialStart: toDate(sub.trial_start),
        trialEnd: toDate(sub.trial_end),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      },
    });
}

async function handleSubscriptionUpsert(
  sub: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  const period = getItemPeriod(sub);

  const updateData = {
    providerPriceId: sub.items.data[0]?.price?.id ?? null,
    tier: 'pro' as const,
    status: mapStripeStatus(sub.status),
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
    trialStart: toDate(sub.trial_start),
    trialEnd: toDate(sub.trial_end),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  };

  // Try to find by subscription ID first, then by customer ID
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.providerSubscriptionId, sub.id),
  });

  if (existing) {
    await db
      .update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, existing.id));
    return;
  }

  // Fall back to customer ID lookup
  if (customerId) {
    const byCustomer = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.providerCustomerId, customerId),
    });
    if (byCustomer) {
      await db
        .update(subscriptions)
        .set({ providerSubscriptionId: sub.id, ...updateData })
        .where(eq(subscriptions.id, byCustomer.id));
    }
  }
}

async function handleSubscriptionDeleted(
  sub: Stripe.Subscription,
): Promise<void> {
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      cancelAtPeriodEnd: false,
    })
    .where(eq(subscriptions.providerSubscriptionId, sub.id));
}

async function handleTrialWillEnd(
  sub: Stripe.Subscription,
): Promise<void> {
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.providerSubscriptionId, sub.id),
    columns: { userId: true },
  });
  if (!existing) return;

  const user = await db.query.users.findFirst({
    where: eq(users.id, existing.userId),
    columns: { email: true },
  });
  if (!user?.email) return;

  await sendTrialEndingEmail(user.email, toDate(sub.trial_end));
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;

  const sub = await db.query.subscriptions.findFirst({
    where: customerId
      ? eq(subscriptions.providerCustomerId, customerId)
      : undefined,
    columns: { id: true, userId: true, status: true },
  });
  if (!sub) return;

  // Extract payment intent ID from invoice payments if available
  const paymentIntentId =
    invoice.payments?.data?.[0]?.payment?.payment_intent &&
    typeof invoice.payments.data[0].payment.payment_intent === 'string'
      ? invoice.payments.data[0].payment.payment_intent
      : null;

  await db.insert(payments).values({
    userId: sub.userId,
    subscriptionId: sub.id,
    providerPaymentId: paymentIntentId ?? invoice.id,
    amountCents: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    providerInvoiceUrl: invoice.hosted_invoice_url ?? null,
  });

  if (sub.status === 'past_due') {
    await db
      .update(subscriptions)
      .set({ status: 'active' })
      .where(eq(subscriptions.id, sub.id));
  }
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
): Promise<void> {
  const customerId =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return;

  await db
    .update(subscriptions)
    .set({ status: 'past_due' })
    .where(eq(subscriptions.providerCustomerId, customerId));
}

const eventHandlers: Record<
  string,
  (event: Stripe.Event) => Promise<void>
> = {
  'checkout.session.completed': async (event) => {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
  },
  'customer.subscription.created': async (event) => {
    await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
  },
  'customer.subscription.updated': async (event) => {
    await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
  },
  'customer.subscription.deleted': async (event) => {
    await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
  },
  'customer.subscription.trial_will_end': async (event) => {
    await handleTrialWillEnd(event.data.object as Stripe.Subscription);
  },
  'invoice.payment_succeeded': async (event) => {
    await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
  },
  'invoice.payment_failed': async (event) => {
    await handlePaymentFailed(event.data.object as Stripe.Invoice);
  },
};

export async function POST(request: Request) {
  if (!stripe || !WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Billing not configured' },
      { status: 503 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 },
    );
  }

  // Idempotency check: skip if event already processed
  try {
    await db.insert(webhookEvents).values({
      provider: 'stripe',
      eventId: event.id,
      eventType: event.type,
      payload: event.data.object as unknown as Record<string, unknown>,
    });
  } catch {
    // Unique constraint violation means already processed
    return NextResponse.json({ received: true });
  }

  // Process the event -- always return 200 to prevent Stripe retries
  const handler = eventHandlers[event.type];
  if (handler) {
    try {
      await handler(event);
    } catch (err) {
      console.error(`Webhook handler error for ${event.type}:`, err);
    }
  }

  return NextResponse.json({ received: true });
}
