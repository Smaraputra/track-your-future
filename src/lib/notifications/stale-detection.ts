import { and, eq, lt, not, inArray } from 'drizzle-orm';

import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { notifications } from '@/db/schema/notifications';

const TERMINAL_STATUSES = ['offer', 'rejected', 'ghosted', 'withdrawn'] as const;
const STALE_DAYS = 7;

export async function detectStaleApps(userId: string): Promise<number> {
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - STALE_DAYS);

  // Find stale apps
  const staleApps = await db
    .select({
      id: applications.id,
      companyName: applications.companyName,
      jobTitle: applications.jobTitle,
    })
    .from(applications)
    .where(
      and(
        eq(applications.userId, userId),
        not(inArray(applications.currentStatus, [...TERMINAL_STATUSES])),
        lt(applications.updatedAt, staleThreshold),
      ),
    );

  if (staleApps.length === 0) return 0;

  let created = 0;

  for (const app of staleApps) {
    // Check if stale notification already exists for this app
    const existing = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, 'stale_app'),
          eq(notifications.applicationId, app.id),
          eq(notifications.isRead, false),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(notifications).values({
        userId,
        type: 'stale_app',
        title: `${app.companyName} needs attention`,
        body: `Your application for ${app.jobTitle} at ${app.companyName} hasn't been updated in over ${STALE_DAYS} days.`,
        applicationId: app.id,
      });
      created++;
    }
  }

  return created;
}
