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

  it('uses getBillingProvider for provider abstraction', () => {
    expect(source).toContain('getBillingProvider');
    expect(source).toContain('provider.createCheckout');
  });

  it('returns 503 when provider is not configured', () => {
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

  it('passes user info and existing customer ID to provider', () => {
    expect(source).toContain('providerCustomerId');
    expect(source).toContain('existingCustomerId');
  });

  it('returns checkout URL from provider', () => {
    expect(source).toContain('result.url');
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

  it('guards against non-Stripe providers', () => {
    expect(source).toContain('getBillingProviderName');
    expect(source).toContain("!== 'stripe'");
    expect(source).toContain('status: 404');
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

  it('uses getBillingProvider for provider abstraction', () => {
    expect(source).toContain('getBillingProvider');
    expect(source).toContain('provider.createPortalSession');
  });

  it('returns 503 when provider is not configured', () => {
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

  it('returns portal URL from provider', () => {
    expect(source).toContain('result.url');
  });
});
