import { z } from 'zod';
import { APPLICATION_STATUSES } from './constants';

export const createApplicationSchema = z.object({
  companyName: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be at most 200 characters'),
  jobTitle: z
    .string()
    .trim()
    .min(1, 'Job title is required')
    .max(200, 'Job title must be at most 200 characters'),
  jobUrl: z
    .string()
    .trim()
    .max(2000, 'URL must be at most 2000 characters')
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
  roleCategoryId: z
    .string()
    .uuid('Invalid role category ID')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .trim()
    .max(5000, 'Notes must be at most 5000 characters')
    .optional()
    .or(z.literal('')),
  currentStatus: z.enum(APPLICATION_STATUSES).optional(),
  appliedAt: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.literal('')),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;

export const updateApplicationSchema = createApplicationSchema.partial();

export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

export const updateStatusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES, {
    errorMap: () => ({ message: 'Invalid application status' }),
  }),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

export const linkDocumentSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
});

export type LinkDocumentInput = z.infer<typeof linkDocumentSchema>;
