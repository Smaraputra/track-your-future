import { cache } from 'react';
import { and, count, eq, gte, inArray, isNull, sql, sum } from 'drizzle-orm';

import { db } from '@/db';
import { subscriptions } from '@/db/schema/billing';
import { applications } from '@/db/schema/applications';
import {
  documents,
  formFieldTemplates,
  roleCategories,
} from '@/db/schema/core';
import { aiUsage } from '@/db/schema/ai';
import { apiTokens } from '@/db/schema/api-tokens';
import { isBillingDisabled, PLAN_LIMITS, type Tier, type ResourceKey, type AiFeatureKey } from './plans';

export interface UserSubscription {
  tier: Tier;
  status: string | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
}

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'] as const;

const BILLING_DISABLED_SUBSCRIPTION: UserSubscription = {
  tier: 'pro',
  status: 'active',
  trialEnd: null,
  cancelAtPeriodEnd: false,
  currentPeriodEnd: null,
  providerCustomerId: null,
  providerSubscriptionId: null,
};

export const getUserSubscription = cache(
  async (userId: string): Promise<UserSubscription> => {
    if (isBillingDisabled()) return BILLING_DISABLED_SUBSCRIPTION;

    const sub = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        inArray(subscriptions.status, [...ACTIVE_STATUSES]),
      ),
    });

    if (!sub) {
      return {
        tier: 'free',
        status: null,
        trialEnd: null,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        providerCustomerId: null,
        providerSubscriptionId: null,
      };
    }

    return {
      tier: sub.tier as Tier,
      status: sub.status,
      trialEnd: sub.trialEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      currentPeriodEnd: sub.currentPeriodEnd,
      providerCustomerId: sub.providerCustomerId,
      providerSubscriptionId: sub.providerSubscriptionId,
    };
  },
);

export interface LimitCheckResult {
  allowed: boolean;
  current: number;
  limit: number | null;
}

async function countApplications(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(applications)
    .where(eq(applications.userId, userId));
  return result.count;
}

async function countDocuments(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.isLatest, true)));
  return result.count;
}

async function countRoleCategories(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(roleCategories)
    .where(eq(roleCategories.userId, userId));
  return result.count;
}

async function countFormFieldTemplates(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(formFieldTemplates)
    .where(eq(formFieldTemplates.userId, userId));
  return result.count;
}

async function sumStorageBytes(userId: string): Promise<number> {
  const [result] = await db
    .select({ total: sum(documents.fileSizeBytes) })
    .from(documents)
    .where(eq(documents.userId, userId));
  return Number(result.total ?? 0);
}

async function countApiTokens(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(apiTokens)
    .where(and(eq(apiTokens.userId, userId), isNull(apiTokens.revokedAt)));
  return result.count;
}

const resourceCounters: Record<
  ResourceKey,
  (userId: string) => Promise<number>
> = {
  applications: countApplications,
  documents: countDocuments,
  roleCategories: countRoleCategories,
  formFieldTemplates: countFormFieldTemplates,
  storageBytes: sumStorageBytes,
  apiTokens: countApiTokens,
};

export async function checkResourceLimit(
  userId: string,
  resource: ResourceKey,
  tier: Tier,
): Promise<LimitCheckResult> {
  const current = await resourceCounters[resource](userId);
  if (isBillingDisabled()) return { allowed: true, current, limit: null };

  const limit = PLAN_LIMITS[tier].resources[resource];

  return {
    allowed: limit === null || current < limit,
    current,
    limit,
  };
}

export async function checkAiLimit(
  userId: string,
  feature: AiFeatureKey,
  tier: Tier,
): Promise<LimitCheckResult> {
  if (isBillingDisabled()) return { allowed: true, current: 0, limit: null };

  const limit = PLAN_LIMITS[tier].ai[feature];

  if (limit === null) {
    return { allowed: true, current: 0, limit: null };
  }

  if (limit === 0) {
    return { allowed: false, current: 0, limit: 0 };
  }

  // Count usage in current calendar month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [result] = await db
    .select({ count: count() })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, userId),
        eq(aiUsage.feature, sql`${feature}`),
        gte(aiUsage.createdAt, monthStart),
      ),
    );

  const current = result.count;

  return {
    allowed: current < limit,
    current,
    limit,
  };
}
