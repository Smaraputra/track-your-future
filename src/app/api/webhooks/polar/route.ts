import { Webhooks } from '@polar-sh/nextjs';
import { eq } from 'drizzle-orm';

import { db } from '@/db';
import {
  subscriptions,
  webhookEvents,
  payments,
} from '@/db/schema/billing';

type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'paused';

function mapPolarStatus(status: string): SubscriptionStatus {
  const mapping: Record<string, SubscriptionStatus> = {
    active: 'active',
    trialing: 'trialing',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'unpaid',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
  };
  return mapping[status] ?? 'canceled';
}

async function recordEvent(
  eventType: string,
  eventId: string,
  payload: Record<string, unknown>,
): Promise<boolean> {
  try {
    await db.insert(webhookEvents).values({
      provider: 'polar',
      eventId,
      eventType,
      payload,
    });
    return true;
  } catch {
    return false;
  }
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? '',

  onSubscriptionCreated: async (payload) => {
    const sub = payload.data;
    const userId = sub.customer.externalId;
    if (!userId) return;

    const isNew = await recordEvent(
      'subscription.created',
      sub.id + ':created',
      { subscriptionId: sub.id, customerId: sub.customerId },
    );
    if (!isNew) return;

    await db
      .insert(subscriptions)
      .values({
        userId,
        provider: 'polar',
        providerCustomerId: sub.customerId,
        providerSubscriptionId: sub.id,
        providerPriceId: sub.productId,
        tier: 'pro',
        status: mapPolarStatus(sub.status),
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialStart: sub.trialStart,
        trialEnd: sub.trialEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      })
      .onConflictDoUpdate({
        target: subscriptions.userId,
        set: {
          provider: 'polar',
          providerCustomerId: sub.customerId,
          providerSubscriptionId: sub.id,
          providerPriceId: sub.productId,
          tier: 'pro',
          status: mapPolarStatus(sub.status),
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          trialStart: sub.trialStart,
          trialEnd: sub.trialEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        },
      });
  },

  onSubscriptionActive: async (payload) => {
    const sub = payload.data;
    const isNew = await recordEvent(
      'subscription.active',
      sub.id + ':active:' + sub.modifiedAt?.toISOString(),
      { subscriptionId: sub.id },
    );
    if (!isNew) return;

    await db
      .update(subscriptions)
      .set({
        status: 'active',
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
      })
      .where(eq(subscriptions.providerSubscriptionId, sub.id));
  },

  onSubscriptionUpdated: async (payload) => {
    const sub = payload.data;
    const isNew = await recordEvent(
      'subscription.updated',
      sub.id + ':updated:' + sub.modifiedAt?.toISOString(),
      { subscriptionId: sub.id, status: sub.status },
    );
    if (!isNew) return;

    await db
      .update(subscriptions)
      .set({
        status: mapPolarStatus(sub.status),
        currentPeriodStart: sub.currentPeriodStart,
        currentPeriodEnd: sub.currentPeriodEnd,
        trialStart: sub.trialStart,
        trialEnd: sub.trialEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        canceledAt: sub.canceledAt,
      })
      .where(eq(subscriptions.providerSubscriptionId, sub.id));
  },

  onSubscriptionCanceled: async (payload) => {
    const sub = payload.data;
    const isNew = await recordEvent(
      'subscription.canceled',
      sub.id + ':canceled:' + sub.canceledAt?.toISOString(),
      { subscriptionId: sub.id },
    );
    if (!isNew) return;

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        canceledAt: sub.canceledAt ?? new Date(),
      })
      .where(eq(subscriptions.providerSubscriptionId, sub.id));
  },

  onSubscriptionRevoked: async (payload) => {
    const sub = payload.data;
    const isNew = await recordEvent(
      'subscription.revoked',
      sub.id + ':revoked:' + sub.endedAt?.toISOString(),
      { subscriptionId: sub.id },
    );
    if (!isNew) return;

    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: sub.endedAt ?? new Date(),
        cancelAtPeriodEnd: false,
      })
      .where(eq(subscriptions.providerSubscriptionId, sub.id));
  },

  onSubscriptionUncanceled: async (payload) => {
    const sub = payload.data;
    const isNew = await recordEvent(
      'subscription.uncanceled',
      sub.id + ':uncanceled:' + sub.modifiedAt?.toISOString(),
      { subscriptionId: sub.id },
    );
    if (!isNew) return;

    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: false,
        canceledAt: null,
      })
      .where(eq(subscriptions.providerSubscriptionId, sub.id));
  },

  onOrderPaid: async (payload) => {
    const order = payload.data;
    const userId = order.customer.externalId;
    if (!userId) return;

    const isNew = await recordEvent(
      'order.paid',
      order.id,
      { orderId: order.id, customerId: order.customerId },
    );
    if (!isNew) return;

    const sub = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.providerCustomerId, order.customerId),
      columns: { id: true },
    });

    await db.insert(payments).values({
      userId,
      subscriptionId: sub?.id ?? null,
      providerPaymentId: order.id,
      amountCents: order.totalAmount,
      currency: order.currency,
      status: 'succeeded',
      providerInvoiceUrl: null,
    });
  },
});
