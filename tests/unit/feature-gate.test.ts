import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import { canAccess, type AiFeatureKey } from '@/lib/billing/plans';

const ROOT = resolve(__dirname, '../..');

describe('canAccess', () => {
  it('pro tier can access all features', () => {
    const features: AiFeatureKey[] = [
      'parse',
      'match',
      'cover_letter',
      'interview_prep',
      'resume_suggestions',
      'jd_extraction',
    ];
    for (const feature of features) {
      expect(canAccess('pro', feature)).toBe(true);
    }
  });

  it('free tier can access parse and match', () => {
    expect(canAccess('free', 'parse')).toBe(true);
    expect(canAccess('free', 'match')).toBe(true);
    expect(canAccess('free', 'jd_extraction')).toBe(true);
  });

  it('free tier cannot access pro-only features', () => {
    expect(canAccess('free', 'cover_letter')).toBe(false);
    expect(canAccess('free', 'interview_prep')).toBe(false);
    expect(canAccess('free', 'resume_suggestions')).toBe(false);
  });
});

describe('isBillingDisabled bypass (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/feature-gate.ts'),
    'utf-8',
  );

  it('imports isBillingDisabled from plans', () => {
    expect(source).toContain('isBillingDisabled');
    expect(source).toContain("from './plans'");
  });

  it('getUserSubscription returns pro tier when billing disabled', () => {
    expect(source).toContain('if (isBillingDisabled()) return BILLING_DISABLED_SUBSCRIPTION');
  });

  it('BILLING_DISABLED_SUBSCRIPTION has tier pro and status active', () => {
    expect(source).toContain("tier: 'pro'");
    expect(source).toContain("status: 'active'");
  });

  it('checkResourceLimit bypasses when billing disabled', () => {
    expect(source).toContain(
      'if (isBillingDisabled()) return { allowed: true, current, limit: null }',
    );
  });

  it('checkAiLimit bypasses when billing disabled', () => {
    expect(source).toContain(
      'if (isBillingDisabled()) return { allowed: true, current: 0, limit: null }',
    );
  });
});

describe('getUserSubscription (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/feature-gate.ts'),
    'utf-8',
  );

  it('is wrapped in React cache()', () => {
    expect(source).toContain("import { cache } from 'react'");
    expect(source).toContain('cache(');
  });

  it('queries subscriptions with active statuses', () => {
    expect(source).toContain('active');
    expect(source).toContain('trialing');
    expect(source).toContain('past_due');
    expect(source).toContain('inArray');
  });

  it('returns free tier defaults when no subscription found', () => {
    expect(source).toContain("tier: 'free'");
    expect(source).toContain('status: null');
  });
});

describe('checkResourceLimit (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/feature-gate.ts'),
    'utf-8',
  );

  it('has counter functions for all resource types', () => {
    expect(source).toContain('countApplications');
    expect(source).toContain('countDocuments');
    expect(source).toContain('countRoleCategories');
    expect(source).toContain('countFormFieldTemplates');
    expect(source).toContain('sumStorageBytes');
  });

  it('returns allowed: true for null limits (unlimited)', () => {
    expect(source).toContain('limit === null || current < limit');
  });

  it('uses count() aggregation', () => {
    expect(source).toContain('count()');
  });

  it('uses sum() for storage bytes', () => {
    expect(source).toContain('sum(documents.fileSizeBytes)');
  });
});

describe('checkAiLimit (source analysis)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/feature-gate.ts'),
    'utf-8',
  );

  it('short-circuits for null limits (unlimited)', () => {
    expect(source).toContain('limit === null');
    expect(source).toContain('allowed: true, current: 0, limit: null');
  });

  it('short-circuits for zero limits (blocked)', () => {
    expect(source).toContain('limit === 0');
    expect(source).toContain('allowed: false, current: 0, limit: 0');
  });

  it('counts usage in current calendar month', () => {
    expect(source).toContain('monthStart.setDate(1)');
    expect(source).toContain('gte(aiUsage.createdAt, monthStart)');
  });

  it('filters by userId and feature', () => {
    expect(source).toContain('eq(aiUsage.userId, userId)');
    expect(source).toContain('eq(aiUsage.feature,');
  });
});

describe('barrel export', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/billing/index.ts'),
    'utf-8',
  );

  it('re-exports stripe client', () => {
    expect(source).toContain("export { stripe } from './stripe'");
  });

  it('re-exports plan limits, canAccess, and isBillingDisabled', () => {
    expect(source).toContain("export { isBillingDisabled, PLAN_LIMITS, PRICES, canAccess } from './plans'");
  });

  it('re-exports feature gate functions', () => {
    expect(source).toContain('getUserSubscription');
    expect(source).toContain('canAccess');
    expect(source).toContain('checkResourceLimit');
    expect(source).toContain('checkAiLimit');
  });

  it('re-exports types', () => {
    expect(source).toContain('UserSubscription');
    expect(source).toContain('LimitCheckResult');
  });
});
