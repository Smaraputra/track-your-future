import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import {
  BILLING_DISABLED,
  PLAN_LIMITS,
  PRICES,
  type Tier,
  type ResourceKey,
  type AiFeatureKey,
} from '@/lib/billing/plans';

const ROOT = resolve(__dirname, '../..');

describe('BILLING_DISABLED', () => {
  it('exports BILLING_DISABLED constant', () => {
    expect(typeof BILLING_DISABLED).toBe('boolean');
  });

  it('reads from process.env.BILLING_DISABLED', () => {
    const source = readFileSync(
      resolve(ROOT, 'src/lib/billing/plans.ts'),
      'utf-8',
    );
    expect(source).toContain(
      "export const BILLING_DISABLED = process.env.BILLING_DISABLED === 'true'",
    );
  });

  it('canAccess checks BILLING_DISABLED before tier', () => {
    const source = readFileSync(
      resolve(ROOT, 'src/lib/billing/plans.ts'),
      'utf-8',
    );
    expect(source).toContain('if (BILLING_DISABLED) return true');
  });
});

describe('PLAN_LIMITS', () => {
  const tiers: Tier[] = ['free', 'pro'];

  it('defines both tiers', () => {
    for (const tier of tiers) {
      expect(PLAN_LIMITS[tier]).toBeDefined();
    }
  });

  it('has resources and ai sections for each tier', () => {
    for (const tier of tiers) {
      expect(PLAN_LIMITS[tier].resources).toBeDefined();
      expect(PLAN_LIMITS[tier].ai).toBeDefined();
    }
  });

  const resourceKeys: ResourceKey[] = [
    'applications',
    'documents',
    'roleCategories',
    'formFieldTemplates',
    'storageBytes',
  ];

  it('includes all resource keys for each tier', () => {
    for (const tier of tiers) {
      for (const key of resourceKeys) {
        expect(PLAN_LIMITS[tier].resources[key]).toBeDefined();
      }
    }
  });

  const aiKeys: AiFeatureKey[] = [
    'parse',
    'match',
    'cover_letter',
    'interview_prep',
    'resume_suggestions',
    'jd_extraction',
  ];

  it('includes all AI feature keys for each tier', () => {
    for (const tier of tiers) {
      for (const key of aiKeys) {
        const val = PLAN_LIMITS[tier].ai[key];
        expect(val === null || typeof val === 'number').toBe(true);
      }
    }
  });

  it('free tier has numeric limits for resources', () => {
    const free = PLAN_LIMITS.free.resources;
    expect(free.applications).toBe(25);
    expect(free.documents).toBe(10);
    expect(free.roleCategories).toBe(3);
    expect(free.formFieldTemplates).toBe(20);
  });

  it('free tier storage is 50 MB in bytes', () => {
    expect(PLAN_LIMITS.free.resources.storageBytes).toBe(50 * 1024 * 1024);
  });

  it('pro tier has null (unlimited) for most resources', () => {
    const pro = PLAN_LIMITS.pro.resources;
    expect(pro.applications).toBeNull();
    expect(pro.documents).toBeNull();
    expect(pro.roleCategories).toBeNull();
    expect(pro.formFieldTemplates).toBeNull();
  });

  it('pro tier storage is 200 MB in bytes', () => {
    expect(PLAN_LIMITS.pro.resources.storageBytes).toBe(50 * 1024 * 1024 * 4);
  });

  it('free tier blocks pro-only AI features', () => {
    const free = PLAN_LIMITS.free.ai;
    expect(free.cover_letter).toBe(0);
    expect(free.interview_prep).toBe(0);
    expect(free.resume_suggestions).toBe(0);
  });

  it('free tier allows limited AI parses and matches', () => {
    const free = PLAN_LIMITS.free.ai;
    expect(free.parse).toBe(3);
    expect(free.match).toBe(3);
    expect(free.jd_extraction).toBe(5);
  });

  it('pro tier has unlimited AI for parse/match/jd_extraction', () => {
    const pro = PLAN_LIMITS.pro.ai;
    expect(pro.parse).toBeNull();
    expect(pro.match).toBeNull();
    expect(pro.jd_extraction).toBeNull();
  });

  it('pro tier has monthly caps on generation features', () => {
    const pro = PLAN_LIMITS.pro.ai;
    expect(pro.cover_letter).toBe(20);
    expect(pro.interview_prep).toBe(20);
    expect(pro.resume_suggestions).toBe(10);
  });
});

describe('PRICES', () => {
  it('monthly price is $9 (900 cents)', () => {
    expect(PRICES.monthly.amountCents).toBe(900);
  });

  it('annual price is $79 (7900 cents)', () => {
    expect(PRICES.annual.amountCents).toBe(7900);
  });

  it('trial period is 14 days', () => {
    expect(PRICES.trialDays).toBe(14);
  });

  it('has priceId fields for Stripe', () => {
    expect(typeof PRICES.monthly.priceId).toBe('string');
    expect(typeof PRICES.annual.priceId).toBe('string');
  });

  it('has productId fields for Polar', () => {
    expect(typeof PRICES.monthly.productId).toBe('string');
    expect(typeof PRICES.annual.productId).toBe('string');
  });
});

describe('Stripe client module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/stripe.ts'),
    'utf-8',
  );

  it('returns null when STRIPE_SECRET_KEY is not set', () => {
    expect(source).toContain('if (!STRIPE_SECRET_KEY) return null');
  });

  it('uses globalThis singleton for dev hot reload', () => {
    expect(source).toContain('globalForStripe');
    expect(source).toContain("process.env.NODE_ENV !== 'production'");
  });

  it('exports stripe as Stripe | null', () => {
    expect(source).toContain('export const stripe: Stripe | null');
  });
});
