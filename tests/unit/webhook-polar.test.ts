import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Polar webhook handler (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/webhooks/polar/route.ts'),
    'utf-8',
  );

  it('uses @polar-sh/nextjs Webhooks handler', () => {
    expect(source).toContain("import { Webhooks } from '@polar-sh/nextjs'");
    expect(source).toContain('Webhooks({');
  });

  it('reads POLAR_WEBHOOK_SECRET from env', () => {
    expect(source).toContain('process.env.POLAR_WEBHOOK_SECRET');
  });

  it('returns 503 when webhook secret is not configured', () => {
    expect(source).toContain('!POLAR_WEBHOOK_SECRET');
    expect(source).toContain('status: 503');
    expect(source).toContain('Polar webhooks not configured');
  });

  it('handles subscription.created event', () => {
    expect(source).toContain('onSubscriptionCreated');
  });

  it('handles subscription.active event', () => {
    expect(source).toContain('onSubscriptionActive');
  });

  it('handles subscription.updated event', () => {
    expect(source).toContain('onSubscriptionUpdated');
  });

  it('handles subscription.canceled event', () => {
    expect(source).toContain('onSubscriptionCanceled');
  });

  it('handles subscription.revoked event', () => {
    expect(source).toContain('onSubscriptionRevoked');
  });

  it('handles subscription.uncanceled event', () => {
    expect(source).toContain('onSubscriptionUncanceled');
  });

  it('handles order.paid event', () => {
    expect(source).toContain('onOrderPaid');
  });

  it('uses customer.externalId to find userId', () => {
    expect(source).toContain('customer.externalId');
  });

  it('records events for idempotency', () => {
    expect(source).toContain('recordEvent');
    expect(source).toContain('.insert(webhookEvents)');
    expect(source).toContain("provider: 'polar'");
  });

  it('upserts subscription on creation', () => {
    expect(source).toContain('.insert(subscriptions)');
    expect(source).toContain('onConflictDoUpdate');
  });

  it('maps Polar subscription status', () => {
    expect(source).toContain('mapPolarStatus');
  });

  it('inserts payment record on order.paid', () => {
    expect(source).toContain('.insert(payments)');
    expect(source).toContain('order.totalAmount');
  });

  it('sets provider to polar', () => {
    expect(source).toContain("provider: 'polar'");
  });

  it('sets cancelAtPeriodEnd on cancel', () => {
    expect(source).toContain('cancelAtPeriodEnd: true');
  });

  it('sets status to canceled on revoke', () => {
    expect(source).toContain("status: 'canceled'");
  });

  it('clears cancelAtPeriodEnd on uncancel', () => {
    expect(source).toContain('cancelAtPeriodEnd: false');
    expect(source).toContain('canceledAt: null');
  });
});
