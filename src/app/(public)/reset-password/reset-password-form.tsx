'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import {
  resetPasswordRequestSchema,
  type ResetPasswordRequestInput,
} from '@/lib/auth/schemas';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/retro-form-field';
import { AuthMessage } from '@/components/auth/auth-message';

export function ResetPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordRequestInput>({
    resolver: zodResolver(resetPasswordRequestSchema),
  });

  async function onSubmit(data: ResetPasswordRequestInput) {
    setServerError(null);

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setSubmitted(true);
      return;
    }

    if (res.status === 429) {
      setServerError('Too many requests. Please try again later.');
    } else {
      const body = await res.json().catch(() => null);
      setServerError(body?.error || 'Request failed. Please try again.');
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-primary text-2xl">Check Your Email</h1>
        <AuthMessage
          variant="success"
          message="If an account exists with that email, we've sent a password reset link."
        />
        <p className="font-body text-muted-foreground text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-primary text-2xl">Reset Password</h1>
        <p className="font-body text-muted-foreground text-sm">
          Enter your email to receive a reset link
        </p>
      </div>

      {serverError && <AuthMessage variant="error" message={serverError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <RetroFormField label="Email" error={errors.email?.message}>
          <RetroInput
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            {...register('email')}
          />
        </RetroFormField>

        <RetroButton type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
