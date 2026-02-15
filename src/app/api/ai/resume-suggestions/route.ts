import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { resumeSuggestions } from '@/db/schema/ai';
import { getUserSubscription, checkAiLimit } from '@/lib/billing/feature-gate';
import { canAccess } from '@/lib/billing/plans';
import { getApplicationCvData, getApplicationJdData } from '@/lib/ai/application-data';
import { generateResumeSuggestions } from '@/lib/ai/resume-suggestions-generator';
import { logAiUsage } from '@/lib/ai/usage';
import { MODEL_NAMES } from '@/lib/ai/models';
import { isAIAvailable } from '@/lib/ai/providers';
import { checkRateLimit } from '@/lib/rate-limit';
import { AI_BURST_LIMIT } from '@/lib/rate-limit-configs';

const bodySchema = z.object({
  applicationId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const rl = await checkRateLimit(`ai:${userId}`, AI_BURST_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many AI requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    );
  }

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

  const { applicationId } = parsed.data;

  // Verify application ownership
  const app = await db.query.applications.findFirst({
    where: and(
      eq(applications.id, applicationId),
      eq(applications.userId, userId),
    ),
  });

  if (!app) {
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 },
    );
  }

  // Check subscription and access
  const sub = await getUserSubscription(userId);

  if (!canAccess(sub.tier, 'resume_suggestions')) {
    return NextResponse.json(
      { error: 'Resume suggestions require a Pro plan' },
      { status: 403 },
    );
  }

  const limitCheck = await checkAiLimit(userId, 'resume_suggestions', sub.tier);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Monthly resume suggestions limit reached',
        current: limitCheck.current,
        limit: limitCheck.limit,
      },
      { status: 429 },
    );
  }

  if (!isAIAvailable()) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 503 },
    );
  }

  // Fetch CV data (required)
  const cvData = await getApplicationCvData(applicationId, userId);

  if (!cvData) {
    return NextResponse.json(
      { error: 'No parsed CV found. Parse a CV first.' },
      { status: 422 },
    );
  }

  // Fetch JD data (optional -- enhances suggestions)
  const jdData = await getApplicationJdData(applicationId, userId);

  // Generate resume suggestions
  let suggestionsResult;
  let usage;
  try {
    const result = await generateResumeSuggestions(
      cvData.parsedData,
      jdData?.analysis,
    );
    suggestionsResult = result.data;
    usage = result.usage;
  } catch {
    return NextResponse.json(
      { error: 'AI generation failed. Please try again.' },
      { status: 500 },
    );
  }

  // Upsert: delete existing suggestions for this application, insert new one
  const [suggestion] = await db.transaction(async (tx) => {
    await tx
      .delete(resumeSuggestions)
      .where(
        and(
          eq(resumeSuggestions.applicationId, applicationId),
          eq(resumeSuggestions.userId, userId),
        ),
      );

    return tx
      .insert(resumeSuggestions)
      .values({
        userId,
        applicationId,
        documentId: cvData.documentId,
        result: suggestionsResult,
      })
      .returning();
  });

  // Log AI usage
  await logAiUsage(
    userId,
    'resume_suggestions',
    MODEL_NAMES.resume_suggestions,
    usage.inputTokens,
    usage.outputTokens,
  );

  return NextResponse.json(suggestion, { status: 201 });
}
