import {
  and,
  count,
  desc,
  eq,
  gte,
  sql,
} from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications, applicationStatusHistory } from '@/db/schema/applications';
import { roleCategories } from '@/db/schema/core';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { RetroWindow } from '@/components/retro-window';
import { AnalyticsContent } from '@/components/analytics/analytics-content';

const FUNNEL_STAGES = ['applied', 'phone_screen', 'interview', 'offer'] as const;

export default async function AnalyticsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const sub = await getUserSubscription(userId);

  // Free tier: current calendar month only; Pro: all time
  const dateFilter = sub.tier === 'free'
    ? (() => {
        const start = new Date();
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return start;
      })()
    : null;

  const dateConditions = (table: { userId: typeof applications.userId; }) =>
    dateFilter
      ? and(eq(table.userId, userId), gte(applications.createdAt, dateFilter))
      : eq(table.userId, userId);

  const [statusDistribution, funnelCounts, roleBreakdown] = await Promise.all([
    // 1. Status distribution
    db
      .select({
        status: applications.currentStatus,
        count: count(),
      })
      .from(applications)
      .where(dateConditions(applications))
      .groupBy(applications.currentStatus),

    // 2. Conversion funnel: count of apps that ever reached each stage
    Promise.all(
      FUNNEL_STAGES.map(async (stage) => {
        const conditions = dateFilter
          ? and(
              eq(applications.userId, userId),
              gte(applications.createdAt, dateFilter),
            )
          : eq(applications.userId, userId);

        if (stage === 'applied') {
          // All non-draft apps count as "applied"
          const [result] = await db
            .select({ count: count() })
            .from(applications)
            .where(
              and(
                conditions,
                sql`${applications.currentStatus} != 'draft'`,
              ),
            );
          return { stage, count: result.count };
        }

        // For other stages, check history
        const [result] = await db
          .select({ count: sql<number>`count(distinct ${applications.id})::int` })
          .from(applications)
          .innerJoin(
            applicationStatusHistory,
            eq(applications.id, applicationStatusHistory.applicationId),
          )
          .where(
            and(
              conditions,
              eq(applicationStatusHistory.toStatus, stage),
            ),
          );
        return { stage, count: result.count };
      }),
    ),

    // 3. Role breakdown
    db
      .select({
        name: roleCategories.name,
        color: roleCategories.color,
        count: count(),
      })
      .from(applications)
      .innerJoin(roleCategories, eq(applications.roleCategoryId, roleCategories.id))
      .where(dateConditions(applications))
      .groupBy(roleCategories.name, roleCategories.color)
      .orderBy(desc(count())),
  ]);

  return (
    <RetroWindow title="sys://analytics">
      <AnalyticsContent
        statusDistribution={statusDistribution}
        funnelData={funnelCounts}
        roleBreakdown={roleBreakdown}
        tier={sub.tier}
        dateFilter={dateFilter?.toISOString() ?? null}
      />
    </RetroWindow>
  );
}
