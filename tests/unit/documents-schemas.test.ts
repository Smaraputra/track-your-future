import { describe, expect, it } from 'vitest';
import {
  presignRequestSchema,
  confirmUploadSchema,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  DOCUMENT_TYPES,
} from '@/lib/documents/schemas';
import { buildFileKey } from '@/lib/documents/file-key';

describe('ALLOWED_MIME_TYPES', () => {
  it('includes PDF', () => {
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
  });

  it('includes DOCX', () => {
    expect(ALLOWED_MIME_TYPES).toContain(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('has exactly 2 types', () => {
    expect(ALLOWED_MIME_TYPES).toHaveLength(2);
  });
});

describe('MAX_FILE_SIZE_BYTES', () => {
  it('is 10 MB', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(10 * 1024 * 1024);
  });
});

describe('DOCUMENT_TYPES', () => {
  it('includes cv, cover_letter, summary, custom', () => {
    expect(DOCUMENT_TYPES).toEqual(['cv', 'cover_letter', 'summary', 'custom']);
  });
});

describe('presignRequestSchema', () => {
  const validPayload = {
    fileName: 'resume.pdf',
    mimeType: 'application/pdf' as const,
    fileSizeBytes: 1024,
    documentType: 'cv' as const,
  };

  it('accepts valid payload', () => {
    const result = presignRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects empty file name', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      fileName: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only file name', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      fileName: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects disallowed mime types', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      mimeType: 'image/png',
    });
    expect(result.success).toBe(false);
  });

  it('rejects file size exceeding max', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      fileSizeBytes: MAX_FILE_SIZE_BYTES + 1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero file size', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      fileSizeBytes: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative file size', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      fileSizeBytes: -100,
    });
    expect(result.success).toBe(false);
  });

  it('accepts DOCX mime type', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional roleCategoryId', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      roleCategoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid roleCategoryId', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      roleCategoryId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('requires customTypeName when documentType is custom', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      documentType: 'custom',
    });
    expect(result.success).toBe(false);
  });

  it('accepts custom type with customTypeName', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      documentType: 'custom',
      customTypeName: 'Portfolio',
    });
    expect(result.success).toBe(true);
  });

  it('rejects custom type with empty customTypeName', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      documentType: 'custom',
      customTypeName: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional previousDocumentId', () => {
    const result = presignRequestSchema.safeParse({
      ...validPayload,
      previousDocumentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });
    expect(result.success).toBe(true);
  });
});

describe('confirmUploadSchema', () => {
  const validPayload = {
    documentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    fileKey: 'user1/unassigned/cv/doc1/v1/resume.pdf',
    fileName: 'resume.pdf',
    mimeType: 'application/pdf' as const,
    fileSizeBytes: 1024,
    documentType: 'cv' as const,
    version: 1,
  };

  it('accepts valid payload', () => {
    const result = confirmUploadSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it('rejects missing documentId', () => {
    const partial = { ...validPayload };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (partial as any).documentId;
    const result = confirmUploadSchema.safeParse(partial);
    expect(result.success).toBe(false);
  });

  it('rejects invalid documentId', () => {
    const result = confirmUploadSchema.safeParse({
      ...validPayload,
      documentId: 'not-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero version', () => {
    const result = confirmUploadSchema.safeParse({
      ...validPayload,
      version: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional fields', () => {
    const result = confirmUploadSchema.safeParse({
      ...validPayload,
      customTypeName: 'Portfolio',
      roleCategoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      previousDocumentId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });
    expect(result.success).toBe(true);
  });
});

describe('buildFileKey', () => {
  it('builds key with role category', () => {
    const key = buildFileKey({
      userId: 'user-1',
      roleCategoryId: 'role-1',
      documentType: 'cv',
      documentId: 'doc-1',
      version: 1,
      fileName: 'resume.pdf',
    });
    expect(key).toBe('user-1/role-1/cv/doc-1/v1/resume.pdf');
  });

  it('builds key without role category (unassigned)', () => {
    const key = buildFileKey({
      userId: 'user-1',
      documentType: 'cover_letter',
      documentId: 'doc-2',
      version: 3,
      fileName: 'letter.docx',
    });
    expect(key).toBe('user-1/unassigned/cover_letter/doc-2/v3/letter.docx');
  });

  it('includes version number in path', () => {
    const key = buildFileKey({
      userId: 'u',
      documentType: 'cv',
      documentId: 'd',
      version: 5,
      fileName: 'f.pdf',
    });
    expect(key).toContain('/v5/');
  });
});
