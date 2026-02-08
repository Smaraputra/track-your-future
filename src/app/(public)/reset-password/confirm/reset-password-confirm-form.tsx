'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';

import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/auth/retro-form-field';
import { AuthMessage } from '@/components/auth/auth-message';

const resetPasswordConfirmFormSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be at most 128 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordConfirmFormInput = z.infer<typeof resetPasswordConfirmFormSchema>;

interface ResetPasswordConfirmFormProps {
  token: string;
}

export function ResetPasswordConfirmForm({ token }: ResetPasswordConfirmFormProps) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordConfirmFormInput>({
    resolver: zodResolver(resetPasswordConfirmFormSchema),
  });

  async function onSubmit(data: ResetPasswordConfirmFormInput) {
    setServerError(null);

    const res = await fetch('/api/auth/reset-password/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: data.password }),
    });

    if (res.ok) {
      setSuccess(true);
      return;
    }

    const body = await res.json().catch(() => null);
    setServerError(body?.error || 'Password reset failed. Please try again.');
  }

  if (success) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-primary text-2xl">Password Reset</h1>
        <AuthMessage
          variant="success"
          message="Your password has been reset. You can now log in with your new password."
        />
        <p className="font-body text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Go to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-primary text-2xl">Set New Password</h1>
        <p className="font-body text-muted-foreground text-sm">
          Choose a new password for your account
        </p>
      </div>

      {serverError && <AuthMessage variant="error" message={serverError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <RetroFormField label="New Password" error={errors.password?.message}>
          <RetroInput
            type="password"
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            {...register('password')}
          />
        </RetroFormField>

        <RetroFormField label="Confirm Password" error={errors.confirmPassword?.message}>
          <RetroInput
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            {...register('confirmPassword')}
          />
        </RetroFormField>

        <RetroButton type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </RetroButton>
      </form>

      <p className="font-body text-muted-foreground text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
