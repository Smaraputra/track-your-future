'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { loginSchema, type LoginInput } from '@/lib/auth/schemas';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/retro-form-field';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { AuthMessage } from '@/components/auth/auth-message';
import { TurnstileWidget } from '@/components/auth/turnstile-widget';

interface LoginFormProps {
  initialError?: string;
  initialSuccess?: string;
  callbackUrl?: string;
  turnstileSiteKey?: string;
  nonce?: string;
}

export function LoginForm({
  initialError,
  initialSuccess,
  callbackUrl,
  turnstileSiteKey,
  nonce,
}: LoginFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    if (turnstileSiteKey && !turnstileToken) {
      setFormError('Please complete the verification challenge.');
      return;
    }
    setFormError(null);
    await signIn('credentials', {
      email: data.email,
      password: data.password,
      turnstileToken: turnstileToken ?? '',
      redirectTo: callbackUrl || '/dashboard',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-primary text-2xl">Login</h1>
        <p className="font-body text-muted-foreground text-sm">
          Access your command center
        </p>
      </div>

      {initialError && <AuthMessage variant="error" message={initialError} />}
      {initialSuccess && <AuthMessage variant="success" message={initialSuccess} />}
      {formError && <AuthMessage variant="error" message={formError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <RetroFormField label="Email" error={errors.email?.message}>
          <RetroInput
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            {...register('email')}
          />
        </RetroFormField>

        <RetroFormField label="Password" error={errors.password?.message}>
          <RetroInput
            type="password"
            autoComplete="current-password"
            placeholder="Enter password"
            {...register('password')}
          />
        </RetroFormField>

        <TurnstileWidget
          siteKey={turnstileSiteKey}
          nonce={nonce}
          onToken={setTurnstileToken}
        />

        <RetroButton type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Authenticating...' : 'Login'}
        </RetroButton>

        <p className="font-body text-muted-foreground text-right text-xs">
          <Link href="/forgot-password" className="text-primary underline">
            Forgot password?
          </Link>
        </p>

        <p className="font-body text-muted-foreground text-center text-xs">
          Need an account?{' '}
          <Link href="/register" className="text-primary underline">
            Register
          </Link>
        </p>
      </form>

      <OAuthButtons />
    </div>
  );
}
