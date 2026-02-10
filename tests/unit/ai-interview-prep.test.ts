import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('interview-prep-generator module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/lib/ai/interview-prep-generator.ts'),
    'utf-8',
  );

  it('uses generateText and Output from ai SDK', () => {
    expect(source).toContain("from 'ai'");
    expect(source).toContain('generateText');
    expect(source).toContain('Output.object');
  });

  it('uses MODELS.interview_prep model', () => {
    expect(source).toContain('MODELS.interview_prep');
  });

  it('uses interviewPrepResultSchema for structured output', () => {
    expect(source).toContain('interviewPrepResultSchema');
    expect(source).toContain('schema: interviewPrepResultSchema');
  });

  it('includes system prompt with interview coaching rules', () => {
    expect(source).toContain('interview coach');
    expect(source).toContain('3 categories');
    expect(source).toContain('behavioral');
    expect(source).toContain('technical');
    expect(source).toContain('situational');
  });

  it('references STAR method in system prompt', () => {
    expect(source).toContain('STAR');
    expect(source).toContain('Situation');
    expect(source).toContain('Task');
    expect(source).toContain('Action');
    expect(source).toContain('Result');
  });

  it('accepts JD data and optional company name', () => {
    expect(source).toContain('jdData: JdExtractedData');
    expect(source).toContain('companyName?:');
  });

  it('returns data and usage', () => {
    expect(source).toContain('data: result.output');
    expect(source).toContain('inputTokens: result.usage.inputTokens');
  });
});

describe('interview-prep POST route module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/interview-prep/route.ts'),
    'utf-8',
  );

  it('requires authentication', () => {
    expect(source).toContain("{ error: 'Unauthorized' }");
    expect(source).toContain('status: 401');
  });

  it('validates applicationId in body', () => {
    expect(source).toContain('applicationId: z.string().uuid()');
  });

  it('checks canAccess for interview_prep feature', () => {
    expect(source).toContain("canAccess(sub.tier, 'interview_prep')");
  });

  it('checks AI limit for interview_prep', () => {
    expect(source).toContain("checkAiLimit(userId, 'interview_prep', sub.tier)");
  });

  it('only fetches JD data (not CV)', () => {
    expect(source).toContain('getApplicationJdData');
    expect(source).not.toContain('getApplicationCvData');
  });

  it('performs upsert via transaction', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('delete(interviewPreps)');
    expect(source).toContain('insert(interviewPreps)');
  });

  it('passes companyName to generator', () => {
    expect(source).toContain('app.companyName');
  });

  it('logs AI usage with interview_prep feature', () => {
    expect(source).toContain("'interview_prep'");
    expect(source).toContain('MODEL_NAMES.interview_prep');
  });
});

describe('interview-prep GET route module', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/interview-prep/[applicationId]/route.ts'),
    'utf-8',
  );

  it('requires authentication', () => {
    expect(source).toContain("{ error: 'Unauthorized' }");
    expect(source).toContain('status: 401');
  });

  it('queries interviewPreps by applicationId and userId', () => {
    expect(source).toContain('interviewPreps.applicationId');
    expect(source).toContain('interviewPreps.userId');
  });

  it('returns 404 when not found', () => {
    expect(source).toContain("error: 'Interview prep not found'");
    expect(source).toContain('status: 404');
  });
});
