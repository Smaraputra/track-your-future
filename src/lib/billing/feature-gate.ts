import { cache } from 'react';
import { and, count, eq, gte, inArray, sql, sum } from 'drizzle-orm';

import { db } from '@/db';
import { subscriptions } from '@/db/schema/billing';
import { applications } from '@/db/schema/applications';
import {
  documents,
  formFieldTemplates,
  roleCategories,
} from '@/db/schema/core';
import { aiUsage } from '@/db/schema/ai';
import { PLAN_LIMITS, type Tier, type ResourceKey, type AiFeatureKey } from './plans';

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

export const getUserSubscription = cache(
  async (userId: string): Promise<UserSubscription> => {
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
    .where(eq(documents.userId, userId));
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

const resourceCounters: Record<
  ResourceKey,
  (userId: string) => Promise<number>
> = {
  applications: countApplications,
  documents: countDocuments,
  roleCategories: countRoleCategories,
  formFieldTemplates: countFormFieldTemplates,
  storageBytes: sumStorageBytes,
};

export async function checkResourceLimit(
  userId: string,
  resource: ResourceKey,
  tier: Tier,
): Promise<LimitCheckResult> {
  const limit = PLAN_LIMITS[tier].resources[resource];
  const current = await resourceCounters[resource](userId);

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
