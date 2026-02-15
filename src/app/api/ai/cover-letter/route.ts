import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { coverLetters } from '@/db/schema/ai';
import { getUserSubscription, checkAiLimit } from '@/lib/billing/feature-gate';
import { canAccess } from '@/lib/billing/plans';
import { getApplicationCvData, getApplicationJdData } from '@/lib/ai/application-data';
import { generateCoverLetter } from '@/lib/ai/cover-letter-generator';
import { logAiUsage } from '@/lib/ai/usage';
import { MODEL_NAMES } from '@/lib/ai/models';
import { isAIAvailable } from '@/lib/ai/providers';
import { checkRateLimit } from '@/lib/rate-limit';
import { AI_BURST_LIMIT } from '@/lib/rate-limit-configs';

const bodySchema = z.object({
  applicationId: z.string().uuid(),
  tone: z.enum(['formal', 'casual', 'technical', 'leadership']),
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

  const { applicationId, tone } = parsed.data;

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

  if (!canAccess(sub.tier, 'cover_letter')) {
    return NextResponse.json(
      { error: 'Cover letter generation requires a Pro plan' },
      { status: 403 },
    );
  }

  const limitCheck = await checkAiLimit(userId, 'cover_letter', sub.tier);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Monthly cover letter limit reached',
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

  // Generate cover letter
  let content: string;
  let usage;
  try {
    const result = await generateCoverLetter(
      cvData.parsedData,
      jdData.analysis,
      tone,
    );
    content = result.content;
    usage = result.usage;
  } catch {
    return NextResponse.json(
      { error: 'AI generation failed. Please try again.' },
      { status: 500 },
    );
  }

  // Upsert: delete existing letter for this application, insert new one
  const [letter] = await db.transaction(async (tx) => {
    await tx
      .delete(coverLetters)
      .where(
        and(
          eq(coverLetters.applicationId, applicationId),
          eq(coverLetters.userId, userId),
        ),
      );

    return tx
      .insert(coverLetters)
      .values({
        userId,
        applicationId,
        tone,
        content,
      })
      .returning();
  });

  // Log AI usage
  await logAiUsage(
    userId,
    'cover_letter',
    MODEL_NAMES.cover_letter,
    usage.inputTokens,
    usage.outputTokens,
  );

  return NextResponse.json(letter, { status: 201 });
}
