import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format')
    .optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = createRoleSchema.partial();

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export const reorderRolesSchema = z.object({
  orderedIds: z
    .array(z.string().uuid('Invalid role ID'))
    .min(1, 'At least one role ID is required'),
});

export type ReorderRolesInput = z.infer<typeof reorderRolesSchema>;
