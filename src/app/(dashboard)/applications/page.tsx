import { asc, desc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { roleCategories } from '@/db/schema/core';
import { getUserSubscription, checkResourceLimit } from '@/lib/billing/feature-gate';
import { RetroWindow } from '@/components/retro-window';
import { ApplicationsPageContent } from '@/components/applications/applications-page-content';

export default async function ApplicationsPage() {
  const session = await auth();
  const userId = session!.user!.id;

  const sub = await getUserSubscription(userId);

  const [apps, roles, appLimit] = await Promise.all([
    db
      .select({
        id: applications.id,
        companyName: applications.companyName,
        jobTitle: applications.jobTitle,
        jobUrl: applications.jobUrl,
        currentStatus: applications.currentStatus,
        appliedAt: applications.appliedAt,
        notes: applications.notes,
        roleCategoryId: applications.roleCategoryId,
        createdAt: applications.createdAt,
        updatedAt: applications.updatedAt,
        roleCategoryName: roleCategories.name,
        roleCategoryColor: roleCategories.color,
      })
      .from(applications)
      .leftJoin(roleCategories, eq(applications.roleCategoryId, roleCategories.id))
      .where(eq(applications.userId, userId))
      .orderBy(desc(applications.updatedAt)),
    db
      .select({
        id: roleCategories.id,
        name: roleCategories.name,
        color: roleCategories.color,
      })
      .from(roleCategories)
      .where(eq(roleCategories.userId, userId))
      .orderBy(asc(roleCategories.name)),
    checkResourceLimit(userId, 'applications', sub.tier),
  ]);

  const serializedApps = apps.map((a) => ({
    ...a,
    appliedAt: a.appliedAt?.toISOString() ?? null,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <RetroWindow title="sys://applications">
      <ApplicationsPageContent
        initialApplications={serializedApps}
        roles={roles}
        applicationCount={appLimit.current}
        applicationLimit={appLimit.limit}
      />
    </RetroWindow>
  );
}
