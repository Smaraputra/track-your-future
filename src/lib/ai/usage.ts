import { db } from '@/db';
import { aiUsage } from '@/db/schema/ai';
import { calculateCost } from './costs';

/** Features that have a corresponding DB enum value in ai_feature */
export type AiDbFeature =
  | 'parse'
  | 'match'
  | 'cover_letter'
  | 'interview_prep'
  | 'resume_suggestions';

export async function logAiUsage(
  userId: string,
  feature: AiDbFeature,
  model: string,
  inputTokens: number,
  outputTokens: number,
): Promise<void> {
  const costCents = calculateCost(model, inputTokens, outputTokens);

  await db.insert(aiUsage).values({
    userId,
    feature,
    model,
    inputTokens,
    outputTokens,
    costCents: costCents.toFixed(4),
  });
}
