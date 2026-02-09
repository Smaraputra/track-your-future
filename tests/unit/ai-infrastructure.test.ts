import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

import { calculateCost } from '@/lib/ai/costs';

const ROOT = resolve(__dirname, '../..');

describe('AI models config', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/models.ts'),
    'utf-8',
  );

  const requiredFeatures = [
    'parse',
    'jd_extraction',
    'match',
    'cover_letter',
    'interview_prep',
    'resume_suggestions',
  ];

  it.each(requiredFeatures)('defines model for %s feature', (feature) => {
    expect(source).toContain(`${feature}:`);
  });

  it('exports MODELS object', () => {
    expect(source).toContain('export const MODELS');
  });

  it('exports MODEL_NAMES mapping', () => {
    expect(source).toContain('export const MODEL_NAMES');
  });
});

describe('AI usage tracking', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/usage.ts'),
    'utf-8',
  );

  it('logAiUsage inserts into aiUsage table', () => {
    expect(source).toContain('db.insert(aiUsage)');
  });

  it('logAiUsage accepts userId, feature, model, inputTokens, outputTokens', () => {
    expect(source).toContain('userId: string');
    expect(source).toContain('feature: AiDbFeature');
    expect(source).toContain('model: string');
    expect(source).toContain('inputTokens: number');
    expect(source).toContain('outputTokens: number');
  });

  it('inserts all required columns', () => {
    expect(source).toContain('userId,');
    expect(source).toContain('feature,');
    expect(source).toContain('model,');
    expect(source).toContain('inputTokens,');
    expect(source).toContain('outputTokens,');
    expect(source).toContain('costCents:');
  });
});

describe('calculateCost', () => {
  it('calculates cost for gpt-4.1-nano correctly', () => {
    // 1M input tokens at 10 cents = 10 cents
    // 1M output tokens at 40 cents = 40 cents
    const cost = calculateCost('gpt-4.1-nano', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(50);
  });

  it('calculates cost for gpt-4o-mini correctly', () => {
    const cost = calculateCost('gpt-4o-mini', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(75);
  });

  it('calculates cost for gpt-4.1 correctly', () => {
    const cost = calculateCost('gpt-4.1', 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(1000);
  });

  it('returns proportional cost for smaller token counts', () => {
    // 1000 input tokens at 10 cents/1M = 0.01 cents
    // 500 output tokens at 40 cents/1M = 0.02 cents
    const cost = calculateCost('gpt-4.1-nano', 1000, 500);
    expect(cost).toBeCloseTo(0.03, 6);
  });

  it('uses fallback rates for unknown models', () => {
    const cost = calculateCost('unknown-model', 1_000_000, 1_000_000);
    // Fallback: 100 input, 400 output = 500
    expect(cost).toBeCloseTo(500);
  });

  it('returns 0 for zero tokens', () => {
    expect(calculateCost('gpt-4.1-nano', 0, 0)).toBe(0);
  });
});

describe('AI providers', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/providers.ts'),
    'utf-8',
  );

  it('imports createOpenAI from @ai-sdk/openai', () => {
    expect(source).toContain("from '@ai-sdk/openai'");
  });

  it('reads OPENAI_API_KEY from environment', () => {
    expect(source).toContain('OPENAI_API_KEY');
  });

  it('exports openai provider instance', () => {
    expect(source).toContain('export const openai');
  });
});
