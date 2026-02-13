import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { documents } from '@/db/schema/core';
import { parsedProfiles } from '@/db/schema/ai';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { canAccess } from '@/lib/billing/plans';
import { checkAiLimit } from '@/lib/billing/feature-gate';
import { getObjectBuffer } from '@/lib/minio/presign';
import { extractText } from '@/lib/ai/text-extraction';
import { parseCvText, calculateConfidence } from '@/lib/ai/cv-parser';
import { logAiUsage } from '@/lib/ai/usage';
import { MODEL_NAMES } from '@/lib/ai/models';
import { isAIAvailable } from '@/lib/ai/providers';

const bodySchema = z.object({
  documentId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { documentId } = parsed.data;

  // Fetch document and verify ownership + type
  const doc = await db.query.documents.findFirst({
    where: and(
      eq(documents.id, documentId),
      eq(documents.userId, userId),
    ),
  });

  if (!doc) {
    return NextResponse.json(
      { error: 'Document not found' },
      { status: 404 },
    );
  }

  if (doc.documentType !== 'cv') {
    return NextResponse.json(
      { error: 'Only CV documents can be parsed' },
      { status: 422 },
    );
  }

  // Check subscription and AI access
  const sub = await getUserSubscription(userId);

  if (!canAccess(sub.tier, 'parse')) {
    return NextResponse.json(
      { error: 'CV parsing is not available on your plan' },
      { status: 403 },
    );
  }

  const limitCheck = await checkAiLimit(userId, 'parse', sub.tier);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Monthly CV parsing limit reached',
        current: limitCheck.current,
        limit: limitCheck.limit,
      },
      { status: 429 },
    );
  }

  // Check API key configured
  if (!isAIAvailable()) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 503 },
    );
  }

  // Download file from S3
  let fileBuffer: Buffer;
  try {
    fileBuffer = await getObjectBuffer(doc.fileKey);
  } catch {
    return NextResponse.json(
      { error: 'Failed to download document from storage' },
      { status: 500 },
    );
  }

  // Extract text from document
  let rawText: string;
  try {
    rawText = await extractText(fileBuffer, doc.mimeType);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Text extraction failed';
    return NextResponse.json({ error: message }, { status: 422 });
  }

  // Parse CV with LLM
  let parsedData;
  let usage;
  try {
    const result = await parseCvText(rawText);
    parsedData = result.data;
    usage = result.usage;
  } catch {
    return NextResponse.json(
      { error: 'AI parsing failed. Please try again.' },
      { status: 500 },
    );
  }

  const confidenceScore = calculateConfidence(parsedData);

  // Upsert: delete existing profile for this document, insert new one
  const [profile] = await db.transaction(async (tx) => {
    await tx
      .delete(parsedProfiles)
      .where(
        and(
          eq(parsedProfiles.documentId, documentId),
          eq(parsedProfiles.userId, userId),
        ),
      );

    return tx
      .insert(parsedProfiles)
      .values({
        userId,
        documentId,
        parsedData,
        rawText,
        confidenceScore,
      })
      .returning();
  });

  // Log AI usage
  await logAiUsage(
    userId,
    'parse',
    MODEL_NAMES.parse,
    usage.inputTokens,
    usage.outputTokens,
  );

  return NextResponse.json(profile, { status: 201 });
}
