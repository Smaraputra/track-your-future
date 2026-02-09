import { z } from 'zod';

export const createTemplateSchema = z.object({
  fieldKey: z
    .string()
    .trim()
    .min(1, 'Field key is required')
    .max(200, 'Field key must be at most 200 characters'),
  fieldValue: z
    .string()
    .trim()
    .min(1, 'Field value is required')
    .max(2000, 'Field value must be at most 2000 characters'),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const updateTemplateSchema = createTemplateSchema.partial();

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export const reorderTemplatesSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Invalid template ID'))
    .min(1, 'At least one template ID is required'),
});

export type ReorderTemplatesInput = z.infer<typeof reorderTemplatesSchema>;
