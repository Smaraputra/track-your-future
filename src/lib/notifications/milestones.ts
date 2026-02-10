import { and, count, eq } from 'drizzle-orm';

import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { notifications } from '@/db/schema/notifications';

interface MilestoneCheck {
  type: 'milestone';
  title: string;
  body: string;
  applicationId?: string;
}

export async function detectMilestones(
  userId: string,
  context: { event: 'app_created' | 'status_changed'; applicationId?: string; newStatus?: string },
): Promise<void> {
  const checks: MilestoneCheck[] = [];

  if (context.event === 'app_created') {
    const [result] = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.userId, userId));

    if (result.count === 1) {
      checks.push({
        type: 'milestone',
        title: 'First Application Created',
        body: 'You created your first job application. The journey begins!',
        applicationId: context.applicationId,
      });
    } else if (result.count === 10) {
      checks.push({
        type: 'milestone',
        title: '10 Applications',
        body: 'You have reached 10 applications. Keep the momentum going!',
      });
    }
  }

  if (context.event === 'status_changed' && context.newStatus === 'offer') {
    const existing = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.type, 'milestone'),
          eq(notifications.title, 'First Offer Received'),
        ),
      )
      .limit(1);

    if (existing.length === 0) {
      checks.push({
        type: 'milestone',
        title: 'First Offer Received',
        body: 'Congratulations! You received your first job offer.',
        applicationId: context.applicationId,
      });
    }
  }

  for (const check of checks) {
    await db.insert(notifications).values({
      userId,
      type: check.type,
      title: check.title,
      body: check.body,
      applicationId: check.applicationId ?? null,
    });
  }
}
