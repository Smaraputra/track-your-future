import {
  coverLetters,
  matchScores,
  jobAnalyses,
  parsedProfiles,
  interviewPreps,
  resumeSuggestions,
  aiUsage,
} from '@/db/schema/ai';

/**
 * Read-only AI output tables exposed under `/api/v1/ai/<slug>`. Every table
 * here has `id`, `userId`, and `createdAt` columns, which the routes rely on
 * for scoping and ordering.
 */
export const AI_FEATURE_TABLES = {
  'cover-letters': coverLetters,
  'match-scores': matchScores,
  'job-analyses': jobAnalyses,
  'parsed-profiles': parsedProfiles,
  'interview-preps': interviewPreps,
  'resume-suggestions': resumeSuggestions,
  usage: aiUsage,
} as const;

export type AiFeatureSlug = keyof typeof AI_FEATURE_TABLES;

export function isAiFeatureSlug(value: string): value is AiFeatureSlug {
  return value in AI_FEATURE_TABLES;
}
