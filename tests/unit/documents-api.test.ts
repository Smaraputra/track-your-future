import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Documents list route (GET /api/documents)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/documents/route.ts'),
    'utf-8',
  );

  it('exports GET handler', () => {
    expect(source).toContain('export async function GET');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('filters by isLatest=true', () => {
    expect(source).toContain('eq(documents.isLatest, true)');
  });

  it('scopes by userId', () => {
    expect(source).toContain('eq(documents.userId, session.user.id)');
  });

  it('supports type and role filters via searchParams', () => {
    expect(source).toContain("searchParams.get('type')");
    expect(source).toContain("searchParams.get('roleId')");
  });

  it('LEFT JOINs roleCategories for name/color', () => {
    expect(source).toContain('leftJoin(roleCategories');
    expect(source).toContain('roleCategoryName');
    expect(source).toContain('roleCategoryColor');
  });

  it('orders by createdAt DESC', () => {
    expect(source).toContain('desc(documents.createdAt)');
  });
});

describe('Documents presign route (POST /api/documents/presign)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/documents/presign/route.ts'),
    'utf-8',
  );

  it('exports POST handler', () => {
    expect(source).toContain('export async function POST');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('validates with presignRequestSchema', () => {
    expect(source).toContain('presignRequestSchema.safeParse');
    expect(source).toContain('status: 400');
  });

  it('checks document resource limit', () => {
    expect(source).toContain("checkResourceLimit(userId, 'documents'");
    expect(source).toContain('status: 403');
  });

  it('checks storage limit with file size', () => {
    expect(source).toContain("checkResourceLimit(userId, 'storageBytes'");
    expect(source).toContain('storageLimit.current + fileSizeBytes');
  });

  it('verifies role ownership when roleCategoryId provided', () => {
    expect(source).toContain('eq(roleCategories.userId, userId)');
    expect(source).toContain('Role not found');
    expect(source).toContain('status: 404');
  });

  it('handles versioning via previousDocumentId', () => {
    expect(source).toContain('previousDocumentId');
    expect(source).toContain('prevDoc.version + 1');
    expect(source).toContain('eq(documents.isLatest, true)');
  });

  it('generates documentId and fileKey', () => {
    expect(source).toContain('randomUUID()');
    expect(source).toContain('buildFileKey');
  });

  it('creates presigned PUT URL', () => {
    expect(source).toContain('createPresignedPutUrl');
    expect(source).toContain('uploadUrl');
  });

  it('does not create DB row at presign time', () => {
    expect(source).not.toContain('db.insert(documents)');
    expect(source).not.toContain('.insert(documents)');
  });
});

describe('Documents confirm route (POST /api/documents/confirm)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/documents/confirm/route.ts'),
    'utf-8',
  );

  it('exports POST handler', () => {
    expect(source).toContain('export async function POST');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('validates with confirmUploadSchema', () => {
    expect(source).toContain('confirmUploadSchema.safeParse');
    expect(source).toContain('status: 400');
  });

  it('verifies file exists in MinIO via headObject', () => {
    expect(source).toContain('headObject(fileKey)');
    expect(source).toContain('File not found in storage');
    expect(source).toContain('status: 404');
  });

  it('uses actual size from headObject for storage limit check', () => {
    expect(source).toContain('objectInfo.contentLength');
    expect(source).toContain('storageLimit.current + actualSize');
  });

  it('deletes object if storage limit exceeded', () => {
    expect(source).toContain('deleteObject(fileKey)');
    expect(source).toContain('Storage limit exceeded');
  });

  it('uses transaction for version promotion', () => {
    expect(source).toContain('db.transaction');
    expect(source).toContain('isLatest: false');
  });

  it('inserts document with actual size', () => {
    expect(source).toContain('fileSizeBytes: actualSize');
  });

  it('returns 201 on success', () => {
    expect(source).toContain('status: 201');
  });
});

describe('Document detail route (GET/DELETE /api/documents/[documentId])', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/documents/[documentId]/route.ts'),
    'utf-8',
  );

  it('exports GET and DELETE handlers', () => {
    expect(source).toContain('export async function GET');
    expect(source).toContain('export async function DELETE');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('extracts documentId from params', () => {
    expect(source).toContain('const { documentId } = await params');
  });

  it('scopes queries by userId', () => {
    expect(source).toContain('eq(documents.userId, session.user.id)');
  });

  it('returns 404 when not found', () => {
    expect(source).toContain('Document not found');
    expect(source).toContain('status: 404');
  });

  it('DELETE removes file from MinIO', () => {
    expect(source).toContain('deleteObject(doc.fileKey)');
  });

  it('DELETE promotes previous version when deleting latest', () => {
    expect(source).toContain('doc.isLatest');
    expect(source).toContain('isLatest: true');
  });
});

describe('Document download route (GET /api/documents/[documentId]/download)', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/documents/[documentId]/download/route.ts'),
    'utf-8',
  );

  it('exports GET handler', () => {
    expect(source).toContain('export async function GET');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain('status: 401');
  });

  it('scopes by userId', () => {
    expect(source).toContain('eq(documents.userId, session.user.id)');
  });

  it('creates presigned GET URL for download', () => {
    expect(source).toContain('createPresignedGetUrl');
  });

  it('redirects to presigned URL', () => {
    expect(source).toContain('NextResponse.redirect');
  });
});
