'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/retro-form-field';
import { AuthMessage } from '@/components/auth/auth-message';
import { TurnstileWidget } from '@/components/auth/turnstile-widget';

const formSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be 128 characters or fewer'),
    confirmPassword: z.string().min(1, 'Please retype the password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

interface ResetPasswordFormProps {
  token: string;
  turnstileSiteKey?: string;
  nonce?: string;
}

export function ResetPasswordForm({
  token,
  turnstileSiteKey,
  nonce,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  function resetTurnstile() {
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  async function onSubmit(data: FormValues) {
    setError(null);
    if (turnstileSiteKey && !turnstileToken) {
      setError('Please complete the verification challenge.');
      return;
    }
    const response = await fetch('/api/auth/password-reset/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: data.newPassword, turnstileToken }),
    });

    if (response.status === 429) {
      setError('Too many attempts. Please try again later.');
      resetTurnstile();
      return;
    }
    if (!response.ok) {
      setError('This reset link is no longer valid. Request a new one.');
      resetTurnstile();
      return;
    }
    router.replace('/login?reset=success');
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <AuthMessage variant="error" message={error} />}
      <RetroFormField label="New password" error={errors.newPassword?.message}>
        <RetroInput
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          {...register('newPassword')}
        />
      </RetroFormField>
      <RetroFormField label="Confirm password" error={errors.confirmPassword?.message}>
        <RetroInput
          type="password"
          autoComplete="new-password"
          placeholder="Retype password"
          {...register('confirmPassword')}
        />
      </RetroFormField>
      <TurnstileWidget
        key={turnstileKey}
        siteKey={turnstileSiteKey}
        nonce={nonce}
        onToken={setTurnstileToken}
      />
      <RetroButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Set new password'}
      </RetroButton>
    </form>
  );
}
