import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('cover-letter-generator module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/cover-letter-generator.ts'),
    'utf-8',
  );

  it('uses generateText from ai SDK', () => {
    expect(source).toContain("from 'ai'");
    expect(source).toContain('generateText');
  });

  it('uses MODELS.cover_letter model', () => {
    expect(source).toContain('MODELS.cover_letter');
  });

  it('supports all four tones', () => {
    expect(source).toContain("'formal'");
    expect(source).toContain("'casual'");
    expect(source).toContain("'technical'");
    expect(source).toContain("'leadership'");
  });

  it('includes system prompt with letter writing rules', () => {
    expect(source).toContain('3-4 paragraphs');
    expect(source).toContain('250-400 words');
  });

  it('returns content and usage', () => {
    expect(source).toContain('content: result.text');
    expect(source).toContain('inputTokens: result.usage.inputTokens');
  });

  it('does not use structured output (plain text)', () => {
    expect(source).not.toContain('Output.object');
  });

  it('includes tone-specific instructions in prompt', () => {
    expect(source).toContain('TONE_PROMPTS');
    expect(source).toContain('toneInstruction');
  });
});

describe('cover-letter POST route module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/cover-letter/route.ts'),
    'utf-8',
  );

  it('requires authentication', () => {
    expect(source).toContain("{ error: 'Unauthorized' }");
    expect(source).toContain('status: 401');
  });

  it('validates applicationId and tone in body', () => {
    expect(source).toContain('applicationId: z.string().uuid()');
    expect(source).toContain("tone: z.enum(['formal', 'casual', 'technical', 'leadership'])");
  });

  it('checks canAccess for cover_letter feature', () => {
    expect(source).toContain("canAccess(sub.tier, 'cover_letter')");
  });

  it('checks AI limit for cover_letter', () => {
    expect(source).toContain("checkAiLimit(userId, 'cover_letter', sub.tier)");
  });

  it('fetches CV and JD data via shared helpers', () => {
    expect(source).toContain('getApplicationCvData');
    expect(source).toContain('getApplicationJdData');
  });

  it('performs upsert via transaction', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('delete(coverLetters)');
    expect(source).toContain('insert(coverLetters)');
  });

  it('stores tone and content', () => {
    expect(source).toContain('tone,');
    expect(source).toContain('content,');
  });

  it('logs AI usage with cover_letter feature', () => {
    expect(source).toContain("'cover_letter'");
    expect(source).toContain('MODEL_NAMES.cover_letter');
  });
});

describe('cover-letter GET route module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/cover-letter/[applicationId]/route.ts'),
    'utf-8',
  );

  it('requires authentication', () => {
    expect(source).toContain("{ error: 'Unauthorized' }");
    expect(source).toContain('status: 401');
  });

  it('queries coverLetters by applicationId and userId', () => {
    expect(source).toContain('coverLetters.applicationId');
    expect(source).toContain('coverLetters.userId');
  });

  it('returns 404 when not found', () => {
    expect(source).toContain("error: 'Cover letter not found'");
    expect(source).toContain('status: 404');
  });
});
