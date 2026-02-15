import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('BillingProvider interface (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/provider.ts'),
    'utf-8',
  );

  it('defines BillingProviderName type', () => {
    expect(source).toContain("export type BillingProviderName = 'stripe' | 'polar'");
  });

  it('defines BillingProvider interface with required methods', () => {
    expect(source).toContain('export interface BillingProvider');
    expect(source).toContain('createCheckout');
    expect(source).toContain('createPortalSession');
    expect(source).toContain('cancelSubscription');
  });

  it('includes name and supportsNoCcTrial properties', () => {
    expect(source).toContain('name: BillingProviderName');
    expect(source).toContain('supportsNoCcTrial: boolean');
  });

  it('defines CreateCheckoutParams with userId, email, name, interval, existingCustomerId', () => {
    expect(source).toContain('export interface CreateCheckoutParams');
    expect(source).toContain('userId: string');
    expect(source).toContain('email: string | null');
    expect(source).toContain('name: string | null');
    expect(source).toContain("interval: 'monthly' | 'annual'");
    expect(source).toContain('existingCustomerId: string | null');
  });

  it('getBillingProviderName reads BILLING_PROVIDER env var', () => {
    expect(source).toContain('process.env.BILLING_PROVIDER');
    expect(source).toContain("if (provider === 'polar') return 'polar'");
    expect(source).toContain("return 'stripe'");
  });

  it('getBillingProvider returns StripeBillingProvider by default', () => {
    expect(source).toContain("import('./providers/stripe')");
    expect(source).toContain('new StripeBillingProvider()');
  });

  it('getBillingProvider returns PolarBillingProvider when polar', () => {
    expect(source).toContain("import('./providers/polar')");
    expect(source).toContain('new PolarBillingProvider()');
  });
});

describe('StripeBillingProvider (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/providers/stripe.ts'),
    'utf-8',
  );

  it('implements BillingProvider', () => {
    expect(source).toContain('implements BillingProvider');
  });

  it('sets name to stripe', () => {
    expect(source).toContain("name = 'stripe'");
  });

  it('supports no-CC trial', () => {
    expect(source).toContain('supportsNoCcTrial = true');
  });

  it('creates Stripe customer when no existing ID', () => {
    expect(source).toContain('stripe.customers.create');
  });

  it('creates Stripe checkout session', () => {
    expect(source).toContain('stripe.checkout.sessions.create');
  });

  it('creates billing portal session', () => {
    expect(source).toContain('stripe.billingPortal.sessions.create');
  });

  it('cancels subscription via Stripe API', () => {
    expect(source).toContain('stripe.subscriptions.cancel');
  });

  it('uses priceId from PRICES config', () => {
    expect(source).toContain('PRICES.monthly.priceId');
    expect(source).toContain('PRICES.annual.priceId');
  });
});

describe('PolarBillingProvider (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/providers/polar.ts'),
    'utf-8',
  );

  it('implements BillingProvider', () => {
    expect(source).toContain('implements BillingProvider');
  });

  it('sets name to polar', () => {
    expect(source).toContain("name = 'polar'");
  });

  it('does not support no-CC trial', () => {
    expect(source).toContain('supportsNoCcTrial = false');
  });

  it('creates Polar checkout with productId and externalCustomerId', () => {
    expect(source).toContain('polar.checkouts.create');
    expect(source).toContain('externalCustomerId');
    expect(source).toContain('productId');
  });

  it('creates customer portal session', () => {
    expect(source).toContain('polar.customerSessions.create');
    expect(source).toContain('customerPortalUrl');
  });

  it('revokes subscription for cancellation', () => {
    expect(source).toContain('polar.subscriptions.revoke');
  });

  it('uses productId from PRICES config', () => {
    expect(source).toContain('PRICES.monthly.productId');
    expect(source).toContain('PRICES.annual.productId');
  });
});

describe('Billing index exports (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/index.ts'),
    'utf-8',
  );

  it('exports getBillingProvider and getBillingProviderName', () => {
    expect(source).toContain("export { getBillingProvider, getBillingProviderName } from './provider'");
  });

  it('exports BillingProvider and BillingProviderName types', () => {
    expect(source).toContain("export type { BillingProvider, BillingProviderName } from './provider'");
  });

  it('exports polar client', () => {
    expect(source).toContain("export { polar } from './polar'");
  });
});
