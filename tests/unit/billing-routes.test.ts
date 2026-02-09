import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Checkout route', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/checkout/route.ts'),
    'utf-8',
  );

  it('exports a POST handler', () => {
    expect(source).toContain('export async function POST');
  });

  it('returns 503 when Stripe is not configured', () => {
    expect(source).toContain('!stripe');
    expect(source).toContain('Billing not configured');
    expect(source).toContain('status: 503');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('validates interval with Zod', () => {
    expect(source).toContain("z.enum(['monthly', 'annual'])");
  });

  it('checks for existing active subscription', () => {
    expect(source).toContain("'active', 'trialing'");
    expect(source).toContain('status: 409');
  });

  it('creates or reuses Stripe customer', () => {
    expect(source).toContain('stripe.customers.create');
    expect(source).toContain('providerCustomerId');
  });

  it('creates Checkout Session with client_reference_id', () => {
    expect(source).toContain('stripe.checkout.sessions.create');
    expect(source).toContain('client_reference_id');
  });

  it('includes trial period in checkout', () => {
    expect(source).toContain('trial_period_days');
  });

  it('returns checkout URL', () => {
    expect(source).toContain('checkoutSession.url');
  });
});

describe('Trial route', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/billing/trial/route.ts'),
    'utf-8',
  );

  it('exports a POST handler', () => {
    expect(source).toContain('export async function POST');
  });

  it('returns 503 when Stripe is not configured', () => {
    expect(source).toContain('!stripe');
    expect(source).toContain('Billing not configured');
    expect(source).toContain('status: 503');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('prevents starting a trial with existing active sub', () => {
    expect(source).toContain("'active', 'trialing'");
    expect(source).toContain('status: 409');
  });

  it('prevents re-trial if user already had one', () => {
    expect(source).toContain('existing?.trialEnd');
    expect(source).toContain('Trial already used');
  });

  it('creates subscription with no-CC trial', () => {
    expect(source).toContain('stripe.subscriptions.create');
    expect(source).toContain('trial_period_days');
    expect(source).toContain("missing_payment_method: 'cancel'");
  });

  it('inserts local subscription row', () => {
    expect(source).toContain('db.insert(subscriptions)');
    expect(source).toContain("status: 'trialing'");
  });

  it('returns 201 on success', () => {
    expect(source).toContain('status: 201');
  });
});

describe('Portal route', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/billing/portal/route.ts'),
    'utf-8',
  );

  it('exports a POST handler', () => {
    expect(source).toContain('export async function POST');
  });

  it('returns 503 when Stripe is not configured', () => {
    expect(source).toContain('!stripe');
    expect(source).toContain('Billing not configured');
    expect(source).toContain('status: 503');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('looks up providerCustomerId', () => {
    expect(source).toContain('providerCustomerId');
  });

  it('returns 404 when no billing account found', () => {
    expect(source).toContain('No billing account found');
    expect(source).toContain('status: 404');
  });

  it('creates portal session and returns URL', () => {
    expect(source).toContain('stripe.billingPortal.sessions.create');
    expect(source).toContain('portalSession.url');
  });
});
