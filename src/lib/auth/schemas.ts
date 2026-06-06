import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer'),
  acceptTerms: z
    .boolean()
    .refine((v) => v === true, {
      message: 'You must accept the terms to continue',
    }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(10).max(200),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type PasswordResetRequestInput = z.infer<
  typeof passwordResetRequestSchema
>;

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(10).max(200),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer'),
});

export type PasswordResetConfirmInput = z.infer<
  typeof passwordResetConfirmSchema
>;
