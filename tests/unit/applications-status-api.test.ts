import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Status change route (PATCH /api/applications/[applicationId]/status)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/applications/[applicationId]/status/route.ts'),
    'utf-8',
  );

  it('exports a PATCH handler', () => {
    expect(source).toContain('export async function PATCH');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('validates with updateStatusSchema', () => {
    expect(source).toContain('updateStatusSchema.safeParse');
    expect(source).toContain('Validation failed');
  });

  it('checks application ownership', () => {
    expect(source).toContain('eq(applications.id, applicationId)');
    expect(source).toContain('eq(applications.userId, session.user.id)');
  });

  it('returns 404 when application not found', () => {
    expect(source).toContain('Application not found');
    expect(source).toContain('status: 404');
  });

  it('is idempotent for same status', () => {
    expect(source).toContain('existing.currentStatus === parsed.data.status');
    expect(source).toContain('return NextResponse.json(existing)');
  });

  it('uses a transaction for status update + history insertion', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('.update(applications)');
    expect(source).toContain('tx.insert(applicationStatusHistory)');
  });

  it('records fromStatus and toStatus in history', () => {
    expect(source).toContain('fromStatus: existing.currentStatus');
    expect(source).toContain('toStatus: parsed.data.status');
  });

  it('auto-sets appliedAt on draft to non-draft transition', () => {
    expect(source).toContain("existing.currentStatus === 'draft'");
    expect(source).toContain("parsed.data.status !== 'draft'");
    expect(source).toContain('!existing.appliedAt');
  });
});

describe('Document linking route (GET/POST/DELETE /api/applications/[applicationId]/documents)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/applications/[applicationId]/documents/route.ts'),
    'utf-8',
  );

  it('exports GET, POST, DELETE handlers', () => {
    expect(source).toContain('export async function GET');
    expect(source).toContain('export async function POST');
    expect(source).toContain('export async function DELETE');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('verifies application ownership in all handlers', () => {
    const getSection = source.slice(
      source.indexOf('export async function GET'),
      source.indexOf('export async function POST'),
    );
    const postSection = source.slice(
      source.indexOf('export async function POST'),
      source.indexOf('export async function DELETE'),
    );
    const deleteSection = source.slice(
      source.indexOf('export async function DELETE'),
    );

    expect(getSection).toContain('eq(applications.userId, session.user.id)');
    expect(postSection).toContain('eq(applications.userId, session.user.id)');
    expect(deleteSection).toContain('eq(applications.userId, session.user.id)');
  });

  it('POST validates with linkDocumentSchema', () => {
    expect(source).toContain('linkDocumentSchema.safeParse');
  });

  it('POST verifies document ownership', () => {
    expect(source).toContain('eq(documents.id, parsed.data.documentId)');
    expect(source).toContain('eq(documents.userId, session.user.id)');
    expect(source).toContain('Document not found');
  });

  it('POST returns 409 on duplicate link', () => {
    expect(source).toContain('Document already linked');
    expect(source).toContain('status: 409');
  });

  it('POST returns 201 on success', () => {
    expect(source).toContain('status: 201');
  });

  it('DELETE uses documentId query parameter', () => {
    expect(source).toContain("searchParams.get('documentId')");
    expect(source).toContain('documentId query parameter is required');
  });
});
