import { notFound } from 'next/navigation';
import { and, asc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { roleCategories } from '@/db/schema/core';
import { RetroWindow } from '@/components/retro-window';
import { ApplicationForm } from '@/components/applications/application-form';

export default async function EditApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id;
  const { applicationId } = await params;

  const [app, roles] = await Promise.all([
    db.query.applications.findFirst({
      where: and(
        eq(applications.id, applicationId),
        eq(applications.userId, userId),
      ),
    }),
    db
      .select({ id: roleCategories.id, name: roleCategories.name })
      .from(roleCategories)
      .where(eq(roleCategories.userId, userId))
      .orderBy(asc(roleCategories.name)),
  ]);

  if (!app) {
    notFound();
  }

  return (
    <RetroWindow title={`sys://applications/${app.companyName}/edit`}>
      <ApplicationForm
        mode="edit"
        applicationId={app.id}
        roles={roles}
        defaultValues={{
          companyName: app.companyName,
          jobTitle: app.jobTitle,
          jobUrl: app.jobUrl ?? '',
          roleCategoryId: app.roleCategoryId ?? '',
          notes: app.notes ?? '',
          currentStatus: app.currentStatus,
          appliedAt: app.appliedAt?.toISOString() ?? '',
        }}
      />
    </RetroWindow>
  );
}
