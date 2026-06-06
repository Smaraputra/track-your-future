'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/retro-form-field';
import { AuthMessage } from '@/components/auth/auth-message';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { TurnstileWidget } from '@/components/auth/turnstile-widget';

const formSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be 128 characters or fewer'),
    confirmPassword: z.string().min(1, 'Please retype the password'),
    acceptTerms: z.boolean().refine((v) => v === true, {
      message: 'You must accept the terms to continue',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof formSchema>;

interface RegisterFormProps {
  turnstileSiteKey?: string;
  nonce?: string;
}

export function RegisterForm({ turnstileSiteKey, nonce }: RegisterFormProps) {
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
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { acceptTerms: false },
  });

  async function onSubmit(data: FormValues) {
    setError(null);
    if (turnstileSiteKey && !turnstileToken) {
      setError('Please complete the verification challenge.');
      return;
    }
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          acceptTerms: data.acceptTerms,
          turnstileToken,
        }),
      });
      if (response.status === 429) {
        setError('Too many attempts. Please try again in a little while.');
        resetTurnstile();
        return;
      }
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? 'Registration failed. Please try again.');
        resetTurnstile();
        return;
      }
      router.replace(
        `/verify-email?status=pending&email=${encodeURIComponent(data.email)}`,
      );
    } catch {
      setError('Something went wrong. Please try again.');
      resetTurnstile();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-primary text-2xl">Register</h1>
        <p className="font-body text-muted-foreground text-sm">
          Create your command center
        </p>
      </div>

      {error && <AuthMessage variant="error" message={error} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <RetroFormField label="Name" error={errors.name?.message}>
          <RetroInput
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            {...register('name')}
          />
        </RetroFormField>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            {...register('password')}
          />
        </RetroFormField>

        <RetroFormField
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <RetroInput
            type="password"
            autoComplete="new-password"
            placeholder="Retype password"
            {...register('confirmPassword')}
          />
        </RetroFormField>

        <div className="space-y-1.5">
          <label className="font-body text-muted-foreground flex items-start gap-2 text-xs">
            <input
              type="checkbox"
              className="accent-primary mt-0.5 h-4 w-4"
              {...register('acceptTerms')}
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" target="_blank" className="text-primary underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" className="text-primary underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="font-body text-destructive text-xs">
              {errors.acceptTerms.message}
            </p>
          )}
        </div>

        <TurnstileWidget
          key={turnstileKey}
          siteKey={turnstileSiteKey}
          nonce={nonce}
          onToken={setTurnstileToken}
        />

        <RetroButton type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </RetroButton>

        <p className="font-body text-muted-foreground text-center text-xs">
          Already have an account?{' '}
          <Link href="/login" className="text-primary underline">
            Sign in
          </Link>
        </p>
      </form>

      <OAuthButtons />
    </div>
  );
}
