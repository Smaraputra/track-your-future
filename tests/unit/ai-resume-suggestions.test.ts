import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('resume-suggestions-generator module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/resume-suggestions-generator.ts'),
    'utf-8',
  );

  it('uses generateText and Output from ai SDK', () => {
    expect(source).toContain("from 'ai'");
    expect(source).toContain('generateText');
    expect(source).toContain('Output.object');
  });

  it('uses MODELS.resume_suggestions model', () => {
    expect(source).toContain('MODELS.resume_suggestions');
  });

  it('uses resumeSuggestionResultSchema for structured output', () => {
    expect(source).toContain('resumeSuggestionResultSchema');
    expect(source).toContain('schema: resumeSuggestionResultSchema');
  });

  it('includes system prompt with resume consulting rules', () => {
    expect(source).toContain('resume consultant');
    expect(source).toContain('content');
    expect(source).toContain('formatting');
    expect(source).toContain('keywords');
    expect(source).toContain('impact');
  });

  it('covers all three priority levels in system prompt', () => {
    expect(source).toContain('High priority');
    expect(source).toContain('Medium priority');
    expect(source).toContain('Low priority');
  });

  it('accepts CV data (required) and JD data (optional)', () => {
    expect(source).toContain('cvData: CvParsedData');
    expect(source).toContain('jdData?: JdExtractedData');
  });

  it('tailors prompt based on JD availability', () => {
    expect(source).toContain('tailored to the target job');
    expect(source).toContain('general improvement suggestions');
  });

  it('returns data and usage', () => {
    expect(source).toContain('data: result.output');
    expect(source).toContain('inputTokens: result.usage.inputTokens');
  });
});

describe('resume-suggestions POST route module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/resume-suggestions/route.ts'),
    'utf-8',
  );

  it('requires authentication', () => {
    expect(source).toContain("{ error: 'Unauthorized' }");
    expect(source).toContain('status: 401');
  });

  it('validates applicationId in body', () => {
    expect(source).toContain('applicationId: z.string().uuid()');
  });

  it('checks canAccess for resume_suggestions feature', () => {
    expect(source).toContain("canAccess(sub.tier, 'resume_suggestions')");
  });

  it('checks AI limit for resume_suggestions', () => {
    expect(source).toContain("checkAiLimit(userId, 'resume_suggestions', sub.tier)");
  });

  it('fetches CV data via shared helper (required)', () => {
    expect(source).toContain('getApplicationCvData');
  });

  it('fetches JD data optionally', () => {
    expect(source).toContain('getApplicationJdData');
    expect(source).toContain('jdData?.analysis');
  });

  it('performs upsert via transaction', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('delete(resumeSuggestions)');
    expect(source).toContain('insert(resumeSuggestions)');
  });

  it('stores documentId from parsed CV', () => {
    expect(source).toContain('documentId: cvData.documentId');
  });

  it('logs AI usage with resume_suggestions feature', () => {
    expect(source).toContain("'resume_suggestions'");
    expect(source).toContain('MODEL_NAMES.resume_suggestions');
  });
});

describe('resume-suggestions GET route module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/resume-suggestions/[applicationId]/route.ts'),
    'utf-8',
  );

  it('requires authentication', () => {
    expect(source).toContain("{ error: 'Unauthorized' }");
    expect(source).toContain('status: 401');
  });

  it('queries resumeSuggestions by applicationId and userId', () => {
    expect(source).toContain('resumeSuggestions.applicationId');
    expect(source).toContain('resumeSuggestions.userId');
  });

  it('returns 404 when not found', () => {
    expect(source).toContain("error: 'Resume suggestions not found'");
    expect(source).toContain('status: 404');
  });
});
