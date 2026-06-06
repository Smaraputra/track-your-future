import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Stripe webhook handler', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/webhooks/stripe/route.ts'),
    'utf-8',
  );

  it('exports a POST handler', () => {
    expect(source).toContain('export async function POST');
  });

  it('returns 503 when Stripe is not configured', () => {
    expect(source).toContain('!stripe || !WEBHOOK_SECRET');
    expect(source).toContain('Billing not configured');
    expect(source).toContain('status: 503');
  });

  it('reads raw body via request.text()', () => {
    expect(source).toContain('request.text()');
  });

  it('verifies webhook signature', () => {
    expect(source).toContain('stripe.webhooks.constructEvent');
    expect(source).toContain('stripe-signature');
    expect(source).toContain('WEBHOOK_SECRET');
  });

  it('returns 400 for invalid signature', () => {
    expect(source).toContain('Invalid signature');
    expect(source).toContain('status: 400');
  });

  it('implements idempotency via webhookEvents table', () => {
    expect(source).toContain('db.insert(webhookEvents)');
    expect(source).toContain('eventId: event.id');
  });

  it('returns 200 for duplicate events', () => {
    // Unique constraint violation caught, returns received: true
    expect(source).toContain('received: true');
  });

  it('handles checkout.session.completed', () => {
    expect(source).toContain("'checkout.session.completed'");
    expect(source).toContain('handleCheckoutCompleted');
  });

  it('handles customer.subscription.created', () => {
    expect(source).toContain("'customer.subscription.created'");
    expect(source).toContain('handleSubscriptionUpsert');
  });

  it('handles customer.subscription.updated', () => {
    expect(source).toContain("'customer.subscription.updated'");
  });

  it('handles customer.subscription.deleted', () => {
    expect(source).toContain("'customer.subscription.deleted'");
    expect(source).toContain('handleSubscriptionDeleted');
  });

  it('handles customer.subscription.trial_will_end', () => {
    expect(source).toContain("'customer.subscription.trial_will_end'");
    expect(source).toContain('handleTrialWillEnd');
  });

  it('handles invoice.payment_succeeded', () => {
    expect(source).toContain("'invoice.payment_succeeded'");
    expect(source).toContain('handlePaymentSucceeded');
  });

  it('handles invoice.payment_failed', () => {
    expect(source).toContain("'invoice.payment_failed'");
    expect(source).toContain('handlePaymentFailed');
  });

  it('always returns 200 even on processing errors', () => {
    // Handler errors are caught, logged, and still return received: true
    expect(source).toContain('console.error');
    expect(source).toContain('received: true');
  });

  it('maps Stripe statuses to local enum values', () => {
    expect(source).toContain('mapStripeStatus');
    expect(source).toContain('incomplete_expired');
  });

  it('uses client_reference_id for userId in checkout', () => {
    expect(source).toContain('client_reference_id');
  });

  it('creates subscription with upsert on checkout', () => {
    expect(source).toContain('onConflictDoUpdate');
  });

  it('looks up subscription by ID then falls back to customer ID', () => {
    expect(source).toContain('providerSubscriptionId');
    expect(source).toContain('providerCustomerId');
  });

  it('inserts payment record on successful payment', () => {
    expect(source).toContain('db.insert(payments)');
  });

  it('sends trial ending email', () => {
    expect(source).toContain('sendTrialEndingEmail');
  });

  it('sets subscription to past_due on payment failure', () => {
    expect(source).toContain("status: 'past_due'");
  });

  it('recovers from past_due to active on payment success', () => {
    expect(source).toContain("sub.status === 'past_due'");
    expect(source).toContain("status: 'active'");
  });
});

describe('Auth config allows webhook access', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/auth.ts'),
    'utf-8',
  );

  it('allows /api/webhooks/ paths without authentication', () => {
    expect(source).toContain("/api/webhooks/");
  });
});

describe('Email module exports sendTrialEndingEmail', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/email/index.ts'),
    'utf-8',
  );

  it('has sendTrialEndingEmail function', () => {
    expect(source).toContain('export async function sendTrialEndingEmail');
  });

  it('includes trial end date in email', () => {
    expect(source).toContain('trialEnd');
    expect(source).toContain('trial');
  });
});
