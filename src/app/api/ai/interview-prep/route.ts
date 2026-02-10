import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { interviewPreps } from '@/db/schema/ai';
import { getUserSubscription, checkAiLimit } from '@/lib/billing/feature-gate';
import { canAccess } from '@/lib/billing/plans';
import { getApplicationJdData } from '@/lib/ai/application-data';
import { generateInterviewPrep } from '@/lib/ai/interview-prep-generator';
import { logAiUsage } from '@/lib/ai/usage';
import { MODEL_NAMES } from '@/lib/ai/models';

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

  if (!canAccess(sub.tier, 'interview_prep')) {
    return NextResponse.json(
      { error: 'Interview prep requires a Pro plan' },
      { status: 403 },
    );
  }

  const limitCheck = await checkAiLimit(userId, 'interview_prep', sub.tier);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Monthly interview prep limit reached',
        current: limitCheck.current,
        limit: limitCheck.limit,
      },
      { status: 429 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI service not configured' },
      { status: 503 },
    );
  }

  // Fetch JD data (CV not required for interview prep)
  const jdData = await getApplicationJdData(applicationId, userId);

  if (!jdData) {
    return NextResponse.json(
      { error: 'No job description analysis found. Extract the JD first.' },
      { status: 422 },
    );
  }

  // Generate interview prep
  let prepResult;
  let usage;
  try {
    const result = await generateInterviewPrep(
      jdData.analysis,
      app.companyName,
    );
    prepResult = result.data;
    usage = result.usage;
  } catch {
    return NextResponse.json(
      { error: 'AI generation failed. Please try again.' },
      { status: 500 },
    );
  }

  // Upsert: delete existing prep for this application, insert new one
  const [prep] = await db.transaction(async (tx) => {
    await tx
      .delete(interviewPreps)
      .where(
        and(
          eq(interviewPreps.applicationId, applicationId),
          eq(interviewPreps.userId, userId),
        ),
      );

    return tx
      .insert(interviewPreps)
      .values({
        userId,
        applicationId,
        result: prepResult,
      })
      .returning();
  });

  // Log AI usage
  await logAiUsage(
    userId,
    'interview_prep',
    MODEL_NAMES.interview_prep,
    usage.inputTokens,
    usage.outputTokens,
  );

  return NextResponse.json(prep, { status: 201 });
}
