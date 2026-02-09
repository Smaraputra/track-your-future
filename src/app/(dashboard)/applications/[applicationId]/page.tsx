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
import { jobAnalyses, matchScores, parsedProfiles } from '@/db/schema/ai';
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

  const [sub, history, linkedDocs, allDocs, jobAnalysis, matchScore, hasParsedCv] =
    await Promise.all([
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
      db.query.jobAnalyses.findFirst({
        where: and(
          eq(jobAnalyses.applicationId, applicationId),
          eq(jobAnalyses.userId, userId),
        ),
      }),
      db.query.matchScores.findFirst({
        where: and(
          eq(matchScores.applicationId, applicationId),
          eq(matchScores.userId, userId),
        ),
      }),
      db
        .select({ id: parsedProfiles.id })
        .from(applicationDocuments)
        .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
        .innerJoin(parsedProfiles, eq(parsedProfiles.documentId, documents.id))
        .where(
          and(
            eq(applicationDocuments.applicationId, applicationId),
            eq(documents.documentType, 'cv'),
            eq(documents.userId, userId),
            eq(parsedProfiles.userId, userId),
          ),
        )
        .limit(1)
        .then((rows) => rows.length > 0),
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
        hasParsedCv={hasParsedCv}
        jobAnalysis={
          jobAnalysis
            ? {
                id: jobAnalysis.id,
                analysis: jobAnalysis.analysis,
                createdAt: jobAnalysis.createdAt.toISOString(),
              }
            : null
        }
        matchScore={
          matchScore
            ? {
                id: matchScore.id,
                score: matchScore.score,
                result: matchScore.result,
                createdAt: matchScore.createdAt.toISOString(),
              }
            : null
        }
      />
    </RetroWindow>
  );
}
