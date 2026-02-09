import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications, applicationDocuments } from '@/db/schema/applications';
import { documents } from '@/db/schema/core';
import { linkDocumentSchema } from '@/lib/applications/schemas';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  // Verify application ownership
  const app = await db.query.applications.findFirst({
    where: and(
      eq(applications.id, applicationId),
      eq(applications.userId, session.user.id),
    ),
  });

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  const linkedDocs = await db
    .select({
      id: documents.id,
      fileName: documents.fileName,
      documentType: documents.documentType,
      customTypeName: documents.customTypeName,
      mimeType: documents.mimeType,
      fileSizeBytes: documents.fileSizeBytes,
      createdAt: documents.createdAt,
    })
    .from(applicationDocuments)
    .innerJoin(documents, eq(applicationDocuments.documentId, documents.id))
    .where(eq(applicationDocuments.applicationId, applicationId));

  return NextResponse.json(linkedDocs);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = linkDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Verify application ownership
  const app = await db.query.applications.findFirst({
    where: and(
      eq(applications.id, applicationId),
      eq(applications.userId, session.user.id),
    ),
  });

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  // Verify document ownership
  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, parsed.data.documentId),
      eq(documents.userId, session.user.id),
    ),
  });

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Check for existing link
  const existingLink = await db.query.applicationDocuments.findFirst({
    where: and(
      eq(applicationDocuments.applicationId, applicationId),
      eq(applicationDocuments.documentId, parsed.data.documentId),
    ),
  });

  if (existingLink) {
    return NextResponse.json(
      { error: 'Document already linked to this application' },
      { status: 409 },
    );
  }

  await db.insert(applicationDocuments).values({
    applicationId,
    documentId: parsed.data.documentId,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ applicationId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { applicationId } = await params;

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return NextResponse.json(
      { error: 'documentId query parameter is required' },
      { status: 400 },
    );
  }

  // Verify application ownership
  const app = await db.query.applications.findFirst({
    where: and(
      eq(applications.id, applicationId),
      eq(applications.userId, session.user.id),
    ),
  });

  if (!app) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 });
  }

  await db
    .delete(applicationDocuments)
    .where(
      and(
        eq(applicationDocuments.applicationId, applicationId),
        eq(applicationDocuments.documentId, documentId),
      ),
    );

  return NextResponse.json({ success: true });
}
