import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('match-scorer module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/match-scorer.ts'),
    'utf-8',
  );

  it('uses generateText from ai SDK', () => {
    expect(source).toContain("from 'ai'");
    expect(source).toContain('generateText');
  });

  it('uses Output.object for structured output', () => {
    expect(source).toContain('Output.object');
    expect(source).toContain('matchScoreResultSchema');
  });

  it('uses MODELS.match model', () => {
    expect(source).toContain('MODELS.match');
  });

  it('includes system prompt with scoring rules', () => {
    expect(source).toContain('weighted average');
    expect(source).toContain('skills (35%)');
    expect(source).toContain('experience (30%)');
  });

  it('accepts cvData and jdData parameters', () => {
    expect(source).toContain('cvData: CvParsedData');
    expect(source).toContain('jdData: JdExtractedData');
  });

  it('returns data and usage', () => {
    expect(source).toContain('data: result.output');
    expect(source).toContain('inputTokens: result.usage.inputTokens');
  });
});

describe('match API route module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/match/route.ts'),
    'utf-8',
  );

  it('requires authentication', () => {
    expect(source).toContain("{ error: 'Unauthorized' }");
    expect(source).toContain('status: 401');
  });

  it('validates applicationId in body', () => {
    expect(source).toContain('applicationId: z.string().uuid()');
  });

  it('checks application ownership', () => {
    expect(source).toContain('applications.userId, userId');
    expect(source).toContain("error: 'Application not found'");
  });

  it('checks subscription access and limits', () => {
    expect(source).toContain('getUserSubscription');
    expect(source).toContain("canAccess(sub.tier, 'match')");
    expect(source).toContain("checkAiLimit(userId, 'match', sub.tier)");
  });

  it('checks OPENAI_API_KEY', () => {
    expect(source).toContain('process.env.OPENAI_API_KEY');
    expect(source).toContain('status: 503');
  });

  it('fetches CV and JD data via shared helpers', () => {
    expect(source).toContain('getApplicationCvData');
    expect(source).toContain('getApplicationJdData');
  });

  it('returns 422 when CV or JD data is missing', () => {
    expect(source).toContain('No parsed CV found');
    expect(source).toContain('No job description analysis found');
    expect(source).toContain('status: 422');
  });

  it('performs upsert via transaction', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('delete(matchScores)');
    expect(source).toContain('insert(matchScores)');
  });

  it('logs AI usage', () => {
    expect(source).toContain('logAiUsage');
    expect(source).toContain("'match'");
    expect(source).toContain('MODEL_NAMES.match');
  });

  it('returns 201 on success', () => {
    expect(source).toContain('status: 201');
  });
});

describe('match GET route module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/match/[applicationId]/route.ts'),
    'utf-8',
  );

  it('requires authentication', () => {
    expect(source).toContain("{ error: 'Unauthorized' }");
    expect(source).toContain('status: 401');
  });

  it('queries matchScores by applicationId and userId', () => {
    expect(source).toContain('matchScores.applicationId');
    expect(source).toContain('matchScores.userId');
  });

  it('returns 404 when not found', () => {
    expect(source).toContain("error: 'Match score not found'");
    expect(source).toContain('status: 404');
  });
});
