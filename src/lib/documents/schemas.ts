import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export const DOCUMENT_TYPES = ['cv', 'cover_letter', 'summary', 'custom'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const presignRequestSchema = z
  .object({
    fileName: z.string().trim().min(1, 'File name is required'),
    mimeType: z.enum(ALLOWED_MIME_TYPES, {
      errorMap: () => ({ message: 'Only PDF and DOCX files are allowed' }),
    }),
    fileSizeBytes: z
      .number()
      .int()
      .positive('File size must be positive')
      .max(MAX_FILE_SIZE_BYTES, `File size must not exceed ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB`),
    documentType: z.enum(DOCUMENT_TYPES),
    customTypeName: z.string().trim().max(100).optional(),
    roleCategoryId: z.string().uuid().optional(),
    previousDocumentId: z.string().uuid().optional(),
  })
  .refine(
    (data) => data.documentType !== 'custom' || (data.customTypeName && data.customTypeName.length > 0),
    { message: 'Custom type name is required when document type is "custom"', path: ['customTypeName'] },
  );

export type PresignRequest = z.infer<typeof presignRequestSchema>;

export const confirmUploadSchema = z.object({
  documentId: z.string().uuid(),
  fileKey: z.string().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  fileSizeBytes: z.number().int().positive(),
  documentType: z.enum(DOCUMENT_TYPES),
  customTypeName: z.string().trim().max(100).optional(),
  roleCategoryId: z.string().uuid().optional(),
  version: z.number().int().positive(),
  previousDocumentId: z.string().uuid().optional(),
});

export type ConfirmUpload = z.infer<typeof confirmUploadSchema>;
