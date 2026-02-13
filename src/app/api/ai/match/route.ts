import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { matchScores } from '@/db/schema/ai';
import { getUserSubscription, checkAiLimit } from '@/lib/billing/feature-gate';
import { canAccess } from '@/lib/billing/plans';
import { getApplicationCvData, getApplicationJdData } from '@/lib/ai/application-data';
import { scoreMatch } from '@/lib/ai/match-scorer';
import { logAiUsage } from '@/lib/ai/usage';
import { MODEL_NAMES } from '@/lib/ai/models';
import { isAIAvailable } from '@/lib/ai/providers';

const bodySchema = z.object({
  applicationId: z.string().uuid(),
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

  if (!canAccess(sub.tier, 'match')) {
    return NextResponse.json(
      { error: 'Match scoring is not available on your plan' },
      { status: 403 },
    );
  }

  const limitCheck = await checkAiLimit(userId, 'match', sub.tier);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Monthly match scoring limit reached',
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

  // Fetch prerequisites
  const [cvData, jdData] = await Promise.all([
    getApplicationCvData(applicationId, userId),
    getApplicationJdData(applicationId, userId),
  ]);

  if (!cvData) {
    return NextResponse.json(
      { error: 'No parsed CV found. Link a CV document and parse it first.' },
      { status: 422 },
    );
  }

  if (!jdData) {
    return NextResponse.json(
      { error: 'No job description analysis found. Extract the JD first.' },
      { status: 422 },
    );
  }

  // Score match with LLM
  let matchResult;
  let usage;
  try {
    const result = await scoreMatch(cvData.parsedData, jdData.analysis);
    matchResult = result.data;
    usage = result.usage;
  } catch {
    return NextResponse.json(
      { error: 'AI scoring failed. Please try again.' },
      { status: 500 },
    );
  }

  // Upsert: delete existing score for this application, insert new one
  const [score] = await db.transaction(async (tx) => {
    await tx
      .delete(matchScores)
      .where(
        and(
          eq(matchScores.applicationId, applicationId),
          eq(matchScores.userId, userId),
        ),
      );

    return tx
      .insert(matchScores)
      .values({
        userId,
        applicationId,
        score: matchResult.overallScore.toFixed(2),
        result: matchResult,
      })
      .returning();
  });

  // Log AI usage
  await logAiUsage(
    userId,
    'match',
    MODEL_NAMES.match,
    usage.inputTokens,
    usage.outputTokens,
  );

  return NextResponse.json(score, { status: 201 });
}
