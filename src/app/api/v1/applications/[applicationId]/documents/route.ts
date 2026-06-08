import { and, eq } from 'drizzle-orm';

import { db } from '@/db';
import { applications, applicationDocuments } from '@/db/schema/applications';
import { documents } from '@/db/schema/core';
import { linkDocumentSchema } from '@/lib/applications/schemas';
import { withApiToken, readJsonBody } from '@/lib/api/v1/with-token';
import { apiOk, apiError, apiValidationError } from '@/lib/api/v1/response';

type Ctx = { params: Promise<{ applicationId: string }> };

export const GET = withApiToken<Ctx>('read', async (_request, { params }, { userId }) => {
  const { applicationId } = await params;

  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
  });
  if (!app) return apiError('not_found', 'Application not found', 404);

  const linkedDocuments = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      documentType: documents.documentType,
      mimeType: documents.mimeType,
      fileSizeBytes: documents.fileSizeBytes,
      createdAt: documents.createdAt,
    })
    .from(applicationDocuments)
    .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
    .where(eq(applicationDocuments.applicationId, applicationId));

  return apiOk(linkedDocuments);
});

export const POST = withApiToken<Ctx>('write', async (request, { params }, { userId }) => {
  const { applicationId } = await params;

  const body = await readJsonBody(request);
  if (!body) return apiError('invalid_json', 'Request body must be valid JSON', 400);

  const parsed = linkDocumentSchema.safeParse(body);
  if (!parsed.success) return apiValidationError(parsed.error);

  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
  });
  if (!app) return apiError('not_found', 'Application not found', 404);

  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, parsed.data.documentId), eq(documents.userId, userId)),
  });
  if (!doc) return apiError('not_found', 'Document not found', 404);

  const existingLink = await db.query.applicationDocuments.findFirst({
    where: and(
      eq(applicationDocuments.applicationId, applicationId),
      eq(applicationDocuments.documentId, parsed.data.documentId),
    ),
  });
  if (existingLink) {
    return apiError('already_linked', 'Document already linked to this application', 409);
  }

  await db.insert(applicationDocuments).values({
    applicationId,
    documentId: parsed.data.documentId,
  });

  return apiOk({ success: true }, 201);
});

export const DELETE = withApiToken<Ctx>('write', async (request, { params }, { userId }) => {
  const { applicationId } = await params;

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');
  if (!documentId) {
    return apiError('invalid_request', 'documentId query parameter is required', 400);
  }

  const app = await db.query.applications.findFirst({
    where: and(eq(applications.id, applicationId), eq(applications.userId, userId)),
  });
  if (!app) return apiError('not_found', 'Application not found', 404);

  await db
    .delete(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.applicationId, applicationId),
        eq(applicationDocuments.documentId, documentId),
      ),
    );

  return apiOk({ success: true });
});
