import { z } from 'zod';

export const API_TOKEN_SCOPES = ['read', 'write'] as const;

export const createApiTokenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  scope: z.enum(API_TOKEN_SCOPES).default('read'),
  expiresInDays: z
    .number()
    .int('Expiry must be a whole number of days')
    .positive('Expiry must be positive')
    .max(365, 'Expiry must be at most 365 days')
    .optional(),
});

export type CreateApiTokenInput = z.infer<typeof createApiTokenSchema>;
