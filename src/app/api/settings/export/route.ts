import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { users } from '@/db/schema/auth';
import { logAuditEvent } from '@/lib/audit/log';
import { checkRateLimit } from '@/lib/rate-limit';
import { EXPORT_LIMIT } from '@/lib/rate-limit-configs';
import { roleCategories, documents, formFieldTemplates } from '@/db/schema/core';
import {
  applications,
  applicationStatusHistory,
  applicationDocuments,
} from '@/db/schema/applications';
import { subscriptions, payments } from '@/db/schema/billing';
import { parsedProfiles, jobAnalyses, aiUsage } from '@/db/schema/ai';
import { notifications } from '@/db/schema/notifications';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const rl = await checkRateLimit(`export:${userId}`, EXPORT_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many export requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

  const [
    userData,
    roleCategoriesData,
    documentsData,
    formFieldTemplatesData,
    applicationsData,
    statusHistoryData,
    applicationDocumentsData,
    subscriptionsData,
    paymentsData,
    parsedProfilesData,
    jobAnalysesData,
    aiUsageData,
    notificationsData,
  ] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    db.query.roleCategories.findMany({
      where: eq(roleCategories.userId, userId),
    }),
    db.query.documents.findMany({
      where: eq(documents.userId, userId),
    }),
    db.query.formFieldTemplates.findMany({
      where: eq(formFieldTemplates.userId, userId),
    }),
    db.query.applications.findMany({
      where: eq(applications.userId, userId),
    }),
    db
      .select()
      .from(applicationStatusHistory)
      .innerJoin(
        applications,
        eq(applicationStatusHistory.applicationId, applications.id),
      )
      .where(eq(applications.userId, userId)),
    db
      .select()
      .from(applicationDocuments)
      .innerJoin(
        applications,
        eq(applicationDocuments.applicationId, applications.id),
      )
      .where(eq(applications.userId, userId)),
    db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, userId),
    }),
    db.query.payments.findMany({
      where: eq(payments.userId, userId),
    }),
    db.query.parsedProfiles.findMany({
      where: eq(parsedProfiles.userId, userId),
    }),
    db.query.jobAnalyses.findMany({
      where: eq(jobAnalyses.userId, userId),
    }),
    db.query.aiUsage.findMany({
      where: eq(aiUsage.userId, userId),
    }),
    db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
    }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: userData,
    roleCategories: roleCategoriesData,
    documents: documentsData,
    formFieldTemplates: formFieldTemplatesData,
    applications: applicationsData,
    applicationStatusHistory: statusHistoryData.map(
      (r) => r.application_status_history,
    ),
    applicationDocuments: applicationDocumentsData.map(
      (r) => r.application_documents,
    ),
    subscriptions: subscriptionsData,
    payments: paymentsData,
    parsedProfiles: parsedProfilesData,
    jobAnalyses: jobAnalysesData,
    aiUsage: aiUsageData,
    notifications: notificationsData,
  };

  await logAuditEvent({
    action: 'data_exported',
    userId,
    request,
    metadata: {
      applicationCount: applicationsData.length,
      documentCount: documentsData.length,
    },
  });

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="tyf-export-${userId}.json"`,
    },
  });
}
