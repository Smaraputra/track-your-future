import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('POST /api/ai/parse-cv route', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/parse-cv/route.ts'),
    'utf-8',
  );

  it('exports POST handler', () => {
    expect(source).toContain('export async function POST');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('validates body with documentId UUID schema', () => {
    expect(source).toContain('bodySchema.safeParse');
    expect(source).toContain('z.string().uuid()');
    expect(source).toContain('status: 400');
  });

  it('verifies document ownership', () => {
    expect(source).toContain('eq(documents.userId, userId)');
    expect(source).toContain('Document not found');
    expect(source).toContain('status: 404');
  });

  it('only allows CV document type', () => {
    expect(source).toContain("doc.documentType !== 'cv'");
    expect(source).toContain('Only CV documents can be parsed');
    expect(source).toContain('status: 422');
  });

  it('checks canAccess for parse feature', () => {
    expect(source).toContain("canAccess(sub.tier, 'parse')");
    expect(source).toContain('status: 403');
  });

  it('checks AI limit', () => {
    expect(source).toContain("checkAiLimit(userId, 'parse', sub.tier)");
    expect(source).toContain('status: 429');
    expect(source).toContain('Monthly CV parsing limit reached');
  });

  it('returns 503 when API key not configured', () => {
    expect(source).toContain('OPENAI_API_KEY');
    expect(source).toContain('AI service not configured');
    expect(source).toContain('status: 503');
  });

  it('downloads file from S3', () => {
    expect(source).toContain('getObjectBuffer(doc.fileKey)');
  });

  it('extracts text from document', () => {
    expect(source).toContain('extractText(fileBuffer, doc.mimeType)');
  });

  it('parses CV with LLM', () => {
    expect(source).toContain('parseCvText(rawText)');
  });

  it('calculates confidence score', () => {
    expect(source).toContain('calculateConfidence(parsedData)');
  });

  it('upserts: deletes old profile then inserts new one', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('delete(parsedProfiles)');
    expect(source).toContain('insert(parsedProfiles)');
  });

  it('logs AI usage', () => {
    expect(source).toContain('logAiUsage');
    expect(source).toContain("'parse'");
    expect(source).toContain('MODEL_NAMES.parse');
  });

  it('returns 201 on success', () => {
    expect(source).toContain('status: 201');
  });
});

describe('GET /api/ai/parse-cv/[documentId] route', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/ai/parse-cv/[documentId]/route.ts'),
    'utf-8',
  );

  it('exports GET handler', () => {
    expect(source).toContain('export async function GET');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('fetches profile by documentId and userId', () => {
    expect(source).toContain('eq(parsedProfiles.documentId, documentId)');
    expect(source).toContain('eq(parsedProfiles.userId, session.user.id)');
  });

  it('returns 404 when profile not found', () => {
    expect(source).toContain('Parsed profile not found');
    expect(source).toContain('status: 404');
  });
});

describe('Documents confirm route (canParse flag)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/documents/confirm/route.ts'),
    'utf-8',
  );

  it('returns canParse flag based on documentType', () => {
    expect(source).toContain("canParse: created.documentType === 'cv'");
  });

  it('no longer has the TODO comment', () => {
    expect(source).not.toContain('TODO: trigger async CV parsing');
  });
});
