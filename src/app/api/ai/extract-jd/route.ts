import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { db } from '@/db';
import { applications } from '@/db/schema/applications';
import { jobAnalyses } from '@/db/schema/ai';
import { getUserSubscription } from '@/lib/billing/feature-gate';
import { canAccess } from '@/lib/billing/plans';
import { checkAiLimit } from '@/lib/billing/feature-gate';
import { fetchUrlAsText } from '@/lib/ai/jina-reader';
import { parseJdText, calculateJdConfidence } from '@/lib/ai/jd-parser';
import { getCachedJd, setCachedJd } from '@/lib/ai/jd-cache';
import { logAiUsage } from '@/lib/ai/usage';
import { MODEL_NAMES } from '@/lib/ai/models';

const bodySchema = z
  .object({
    url: z.string().url().optional(),
    text: z.string().min(1).optional(),
    applicationId: z.string().uuid().optional(),
  })
  .refine((d) => d.url || d.text, {
    message: 'Either url or text must be provided',
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

  const { url, text, applicationId } = parsed.data;

  // Check URL cache first (before billing checks)
  if (url) {
    const cached = await getCachedJd(url);
    if (cached) {
      let analysisId: string | undefined;

      if (applicationId) {
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

        const [analysis] = await db.transaction(async (tx) => {
          await tx
            .delete(jobAnalyses)
            .where(
              and(
                eq(jobAnalyses.applicationId, applicationId),
                eq(jobAnalyses.userId, userId),
              ),
            );

          return tx
            .insert(jobAnalyses)
            .values({
              userId,
              applicationId,
              sourceUrl: url,
              rawText: cached.rawText,
              analysis: cached.data,
            })
            .returning();
        });

        analysisId = analysis.id;
      }

      return NextResponse.json(
        { data: cached.data, cached: true, analysisId },
        { status: analysisId ? 201 : 200 },
      );
    }
  }

  // Cache miss or text input -- need to run LLM, check billing
  const sub = await getUserSubscription(userId);

  if (!canAccess(sub.tier, 'jd_extraction')) {
    return NextResponse.json(
      { error: 'JD extraction is not available on your plan' },
      { status: 403 },
    );
  }

  const limitCheck = await checkAiLimit(userId, 'jd_extraction', sub.tier);
  if (!limitCheck.allowed) {
    return NextResponse.json(
      {
        error: 'Monthly JD extraction limit reached',
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

  // Get text content
  let rawText: string;
  if (url) {
    try {
      rawText = await fetchUrlAsText(url);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fetch URL';
      return NextResponse.json({ error: message }, { status: 422 });
    }
  } else {
    rawText = text!;
  }

  // Parse with LLM
  let jdData;
  let usage;
  try {
    const result = await parseJdText(rawText);
    jdData = result.data;
    usage = result.usage;
  } catch {
    return NextResponse.json(
      { error: 'AI extraction failed. Please try again.' },
      { status: 500 },
    );
  }

  // Cache URL-based results
  if (url) {
    await setCachedJd(url, jdData, rawText);
  }

  // Log AI usage
  await logAiUsage(
    userId,
    'jd_extraction',
    MODEL_NAMES.jd_extraction,
    usage.inputTokens,
    usage.outputTokens,
  );

  // Store in jobAnalyses if applicationId provided
  let analysisId: string | undefined;
  if (applicationId) {
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

    const [analysis] = await db.transaction(async (tx) => {
      await tx
        .delete(jobAnalyses)
        .where(
          and(
            eq(jobAnalyses.applicationId, applicationId),
            eq(jobAnalyses.userId, userId),
          ),
        );

      return tx
        .insert(jobAnalyses)
        .values({
          userId,
          applicationId,
          sourceUrl: url ?? null,
          rawText,
          analysis: jdData,
        })
        .returning();
    });

    analysisId = analysis.id;
  }

  return NextResponse.json(
    { data: jdData, cached: false, analysisId },
    { status: analysisId ? 201 : 200 },
  );
}
