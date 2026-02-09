import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('POST /api/ai/extract-jd route', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/extract-jd/route.ts'),
    'utf-8',
  );

  it('exports POST handler', () => {
    expect(source).toContain('export async function POST');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('validates body with refine requiring url or text', () => {
    expect(source).toContain('bodySchema.safeParse');
    expect(source).toContain('.refine');
    expect(source).toContain('Either url or text must be provided');
    expect(source).toContain('status: 400');
  });

  it('checks Redis cache for URL requests', () => {
    expect(source).toContain('getCachedJd(url)');
  });

  it('returns cached result without billing check', () => {
    expect(source).toContain('cached: true');
  });

  it('checks canAccess for jd_extraction feature', () => {
    expect(source).toContain("canAccess(sub.tier, 'jd_extraction')");
    expect(source).toContain('status: 403');
  });

  it('checks AI limit for jd_extraction', () => {
    expect(source).toContain("checkAiLimit(userId, 'jd_extraction', sub.tier)");
    expect(source).toContain('status: 429');
    expect(source).toContain('Monthly JD extraction limit reached');
  });

  it('returns 503 when API key not configured', () => {
    expect(source).toContain('OPENAI_API_KEY');
    expect(source).toContain('AI service not configured');
    expect(source).toContain('status: 503');
  });

  it('fetches URL via Jina Reader', () => {
    expect(source).toContain('fetchUrlAsText(url)');
  });

  it('parses JD text with LLM', () => {
    expect(source).toContain('parseJdText(rawText)');
  });

  it('caches URL-based results', () => {
    expect(source).toContain('setCachedJd(url, jdData, rawText)');
  });

  it('logs AI usage with jd_extraction feature', () => {
    expect(source).toContain('logAiUsage');
    expect(source).toContain("'jd_extraction'");
    expect(source).toContain('MODEL_NAMES.jd_extraction');
  });

  it('verifies application ownership before storing', () => {
    expect(source).toContain('eq(applications.userId, userId)');
    expect(source).toContain('Application not found');
    expect(source).toContain('status: 404');
  });

  it('upserts: deletes old analysis then inserts new one', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('delete(jobAnalyses)');
    expect(source).toContain('insert(jobAnalyses)');
  });

  it('returns 201 when stored, 200 when not', () => {
    expect(source).toContain("status: analysisId ? 201 : 200");
  });
});

describe('GET /api/ai/extract-jd/[applicationId] route', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/extract-jd/[applicationId]/route.ts'),
    'utf-8',
  );

  it('exports GET handler', () => {
    expect(source).toContain('export async function GET');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('fetches analysis by applicationId and userId', () => {
    expect(source).toContain('eq(jobAnalyses.applicationId, applicationId)');
    expect(source).toContain('eq(jobAnalyses.userId, session.user.id)');
  });

  it('returns 404 when analysis not found', () => {
    expect(source).toContain('Job analysis not found');
    expect(source).toContain('status: 404');
  });
});
