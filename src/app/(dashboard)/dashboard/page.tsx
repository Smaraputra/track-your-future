import {
  and,
  count,
  desc,
  eq,
  inArray,
  lt,
  not,
  sql,
} from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications, applicationStatusHistory } from '@/db/schema/applications';
import { roleCategories } from '@/db/schema/core';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { RetroWindow } from '@/components/retro-window';
import { DashboardContent } from '@/components/dashboard/dashboard-content';

const TERMINAL_STATUSES = ['offer', 'rejected', 'ghosted', 'withdrawn'] as const;
const STALE_DAYS = 7;

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const sub = await getUserSubscription(userId);

  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS);

  const [
    statusCounts,
    staleApps,
    recentActivity,
    roleCounts,
  ] = await Promise.all([
    // 1. Status counts
    db
      .select({
        status: applications.currentStatus,
        count: count(),
      })
      .from(applications)
      .where(eq(applications.userId, userId))
      .groupBy(applications.currentStatus),

    // 2. Stale apps (non-terminal, not updated in 7 days)
    db
      .select({
        id: applications.id,
        companyName: applications.companyName,
        jobTitle: applications.jobTitle,
        currentStatus: applications.currentStatus,
        updatedAt: applications.updatedAt,
        roleCategoryName: roleCategories.name,
        roleCategoryColor: roleCategories.color,
      })
      .from(applications)
      .leftJoin(roleCategories, eq(applications.roleCategoryId, roleCategories.id))
      .where(
        and(
          eq(applications.userId, userId),
          not(inArray(applications.currentStatus, [...TERMINAL_STATUSES])),
          lt(applications.updatedAt, staleThreshold),
        ),
      )
      .orderBy(applications.updatedAt),

    // 3. Recent activity (last 10 status changes)
    db
      .select({
        id: applicationStatusHistory.id,
        applicationId: applicationStatusHistory.applicationId,
        fromStatus: applicationStatusHistory.fromStatus,
        toStatus: applicationStatusHistory.toStatus,
        changedAt: applicationStatusHistory.changedAt,
        companyName: applications.companyName,
        jobTitle: applications.jobTitle,
      })
      .from(applicationStatusHistory)
      .innerJoin(
        applications,
        eq(applicationStatusHistory.applicationId, applications.id),
      )
      .where(eq(applications.userId, userId))
      .orderBy(desc(applicationStatusHistory.changedAt))
      .limit(10),

    // 4. Role categories with app counts
    db
      .select({
        id: roleCategories.id,
        name: roleCategories.name,
        color: roleCategories.color,
        appCount: sql<number>`count(${applications.id})::int`,
      })
      .from(roleCategories)
      .leftJoin(
        applications,
        eq(roleCategories.id, applications.roleCategoryId),
      )
      .where(eq(roleCategories.userId, userId))
      .groupBy(roleCategories.id, roleCategories.name, roleCategories.color),
  ]);

  // Compute stat totals
  const totalApps = statusCounts.reduce((sum, s) => sum + s.count, 0);
  const activeApps = statusCounts
    .filter((s) => !TERMINAL_STATUSES.includes(s.status as typeof TERMINAL_STATUSES[number]))
    .reduce((sum, s) => sum + s.count, 0);
  const interviewApps = statusCounts
    .filter((s) => s.status === 'phone_screen' || s.status === 'interview')
    .reduce((sum, s) => sum + s.count, 0);
  const offerApps = statusCounts
    .filter((s) => s.status === 'offer')
    .reduce((sum, s) => sum + s.count, 0);

  const serializedStaleApps = staleApps.map((a) => ({
    ...a,
    updatedAt: a.updatedAt.toISOString(),
  }));

  const serializedActivity = recentActivity.map((a) => ({
    ...a,
    changedAt: a.changedAt.toISOString(),
  }));

  return (
    <RetroWindow title="sys://dashboard">
      <DashboardContent
        stats={{
          total: totalApps,
          active: activeApps,
          interviews: interviewApps,
          offers: offerApps,
        }}
        staleApps={serializedStaleApps}
        recentActivity={serializedActivity}
        roleCategories={roleCounts}
        tier={sub.tier}
      />
    </RetroWindow>
  );
}
