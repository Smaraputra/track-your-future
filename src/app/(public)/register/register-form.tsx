'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

import { registerSchema, type RegisterInput } from '@/lib/auth/schemas';
import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/retro-form-field';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { AuthMessage } from '@/components/auth/auth-message';

export function RegisterForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setSuccess(true);
      return;
    }

    const body = await res.json().catch(() => null);

    if (res.status === 409) {
      setServerError('An account with this email already exists.');
    } else if (res.status === 429) {
      setServerError('Too many requests. Please try again later.');
    } else {
      setServerError(body?.error || 'Registration failed. Please try again.');
    }
  }

  if (success) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-primary text-2xl">Check Your Email</h1>
        <AuthMessage
          variant="success"
          message="Account created. Check your email for a verification link to activate your account."
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
        <h1 className="font-heading text-primary text-2xl">Register</h1>
        <p className="font-body text-muted-foreground text-sm">
          Initialize your account
        </p>
      </div>

      {serverError && <AuthMessage variant="error" message={serverError} />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <RetroFormField label="Name" error={errors.name?.message}>
          <RetroInput
            type="text"
            autoComplete="name"
            placeholder="Your name"
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
            placeholder="Min. 8 characters"
            {...register('password')}
          />
        </RetroFormField>

        <RetroButton type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Register'}
        </RetroButton>
      </form>

      <OAuthButtons />

      <p className="font-body text-muted-foreground text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
