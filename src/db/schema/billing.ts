import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { subscriptionTierEnum, subscriptionStatusEnum } from './enums';
import { users } from './auth';

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').default('stripe').notNull(),
  providerCustomerId: text('provider_customer_id'),
  providerSubscriptionId: text('provider_subscription_id').unique(),
  providerPriceId: text('provider_price_id'),
  tier: subscriptionTierEnum('tier').default('free').notNull(),
  status: subscriptionStatusEnum('status').default('active').notNull(),
  currentPeriodStart: timestamp('current_period_start', { mode: 'date' }),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  canceledAt: timestamp('canceled_at', { mode: 'date' }),
  trialStart: timestamp('trial_start', { mode: 'date' }),
  trialEnd: timestamp('trial_end', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    provider: text('provider').notNull(),
    eventId: text('event_id').notNull(),
    eventType: text('event_type').notNull(),
    payload: jsonb('payload').notNull(),
    processedAt: timestamp('processed_at', { mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique('webhook_events_provider_event_id_unq').on(t.provider, t.eventId)],
);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, {
    onDelete: 'set null',
  }),
  providerPaymentId: text('provider_payment_id'),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('usd').notNull(),
  status: text('status').notNull(),
  providerInvoiceUrl: text('provider_invoice_url'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
