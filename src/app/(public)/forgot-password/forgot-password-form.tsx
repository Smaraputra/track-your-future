'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  passwordResetRequestSchema,
  type PasswordResetRequestInput,
} from '@/lib/auth/schemas';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/retro-form-field';
import { AuthMessage } from '@/components/auth/auth-message';
import { TurnstileWidget } from '@/components/auth/turnstile-widget';

interface ForgotPasswordFormProps {
  turnstileSiteKey?: string;
  nonce?: string;
}

export function ForgotPasswordForm({
  turnstileSiteKey,
  nonce,
}: ForgotPasswordFormProps) {
  const [submitted, setSubmitted] = useState(false);
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
  } = useForm<PasswordResetRequestInput>({
    resolver: zodResolver(passwordResetRequestSchema),
  });

  async function onSubmit(data: PasswordResetRequestInput) {
    setError(null);
    if (turnstileSiteKey && !turnstileToken) {
      setError('Please complete the verification challenge.');
      return;
    }
    try {
      const response = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, turnstileToken }),
      });
      if (response.status === 429) {
        setError('Too many requests. Please try again in a little while.');
        resetTurnstile();
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
      resetTurnstile();
    }
  }

  if (submitted) {
    return (
      <AuthMessage
        variant="success"
        message="If an account exists for that email, a reset link is on its way. Check your inbox and spam folder."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <AuthMessage variant="error" message={error} />}
      <RetroFormField label="Email" error={errors.email?.message}>
        <RetroInput
          type="email"
          autoComplete="email"
          placeholder="user@example.com"
          {...register('email')}
        />
      </RetroFormField>
      <TurnstileWidget
        key={turnstileKey}
        siteKey={turnstileSiteKey}
        nonce={nonce}
        onToken={setTurnstileToken}
      />
      <RetroButton type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send reset link'}
      </RetroButton>
    </form>
  );
}
