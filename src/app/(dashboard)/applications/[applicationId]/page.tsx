import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import {
  applications,
  applicationStatusHistory,
  applicationDocuments,
} from '@/db/schema/applications';
import { roleCategories, documents } from '@/db/schema/core';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { RetroWindow } from '@/components/retro-window';
import { ApplicationDetail } from '@/components/applications/application-detail';

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const session = await auth();
  const userId = session!.user!.id;
  const { applicationId } = await params;

  const [app] = await db
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
    .where(
      and(
        eq(applications.id, applicationId),
        eq(applications.userId, userId),
      ),
    );

  if (!app) {
    notFound();
  }

  const [sub, history, linkedDocs, allDocs] = await Promise.all([
    getUserSubscription(userId),
    db
      .select()
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(desc(applicationStatusHistory.changedAt)),
    db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        documentType: documents.documentType,
        customTypeName: documents.customTypeName,
      })
      .from(applicationDocuments)
      .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
      .where(eq(applicationDocuments.applicationId, applicationId)),
    db
      .select({
        id: documents.id,
        fileName: documents.fileName,
        documentType: documents.documentType,
      })
      .from(documents)
      .where(
        and(eq(documents.userId, userId), eq(documents.isLatest, true)),
      ),
  ]);

  const serializedApp = {
    ...app,
    appliedAt: app.appliedAt?.toISOString() ?? null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  };

  const serializedHistory = history.map((h) => ({
    ...h,
    changedAt: h.changedAt.toISOString(),
  }));

  return (
    <RetroWindow title={`sys://applications/${app.companyName}`}>
      <ApplicationDetail
        application={serializedApp}
        statusHistory={serializedHistory}
        linkedDocuments={linkedDocs}
        availableDocuments={allDocs}
        isPro={sub.tier === 'pro'}
      />
    </RetroWindow>
  );
}
