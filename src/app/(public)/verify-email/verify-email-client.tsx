'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';
import { RetroFormField } from '@/components/retro-form-field';
import { AuthMessage } from '@/components/auth/auth-message';
import { TurnstileWidget } from '@/components/auth/turnstile-widget';

interface VerifyEmailClientProps {
  token?: string;
  email?: string;
  status?: string;
  turnstileSiteKey?: string;
  nonce?: string;
}

export function VerifyEmailClient({
  token,
  email,
  status,
  turnstileSiteKey,
  nonce,
}: VerifyEmailClientProps) {
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resendEmail, setResendEmail] = useState(email ?? '');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  function resetTurnstile() {
    setTurnstileToken(null);
    setTurnstileKey((k) => k + 1);
  }

  async function onVerify() {
    if (!token) return;
    if (turnstileSiteKey && !turnstileToken) {
      setError('Please complete the verification challenge.');
      return;
    }
    setVerifying(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, turnstileToken }),
      });
      if (response.ok) {
        router.replace('/login?verified=1');
        return;
      }
      setFailed(true);
      setError(
        response.status === 429
          ? 'Too many attempts. Please try again later.'
          : 'This verification link is invalid or has expired.',
      );
      resetTurnstile();
    } catch {
      setFailed(true);
      setError('Something went wrong. Please try again.');
      resetTurnstile();
    } finally {
      setVerifying(false);
    }
  }

  async function onResend(e: React.FormEvent) {
    e.preventDefault();
    if (turnstileSiteKey && !turnstileToken) {
      setResendError('Please complete the verification challenge.');
      return;
    }
    setResending(true);
    setResendError(null);
    try {
      const response = await fetch('/api/auth/verify-email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail, turnstileToken }),
      });
      if (response.status === 429) {
        setResendError('Too many requests. Please try again in a little while.');
        resetTurnstile();
        return;
      }
      setResent(true);
    } catch {
      setResendError('Something went wrong. Please try again.');
      resetTurnstile();
    } finally {
      setResending(false);
    }
  }

  const showTokenAction = !!token && !failed;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-primary text-2xl">Verify Email</h1>
        <p className="font-body text-muted-foreground text-sm">
          {showTokenAction
            ? 'Confirm your email address to activate your account.'
            : 'Check your inbox for a verification link.'}
        </p>
      </div>

      {showTokenAction ? (
        <div className="space-y-4">
          {error && <AuthMessage variant="error" message={error} />}
          <TurnstileWidget
            key={turnstileKey}
            siteKey={turnstileSiteKey}
            nonce={nonce}
            onToken={setTurnstileToken}
          />
          <RetroButton
            type="button"
            onClick={onVerify}
            className="w-full"
            disabled={verifying}
          >
            {verifying ? 'Verifying...' : 'Verify my email'}
          </RetroButton>
        </div>
      ) : (
        <div className="space-y-4">
          {error && <AuthMessage variant="error" message={error} />}
          {status === 'pending' && !error && (
            <AuthMessage
              variant="success"
              message={`We sent a verification link${email ? ` to ${email}` : ''}. Click it to activate your account.`}
            />
          )}

          {resent ? (
            <AuthMessage
              variant="success"
              message="If that email needs verifying, a new link is on its way. Check your inbox and spam folder."
            />
          ) : (
            <form onSubmit={onResend} className="space-y-4">
              <p className="font-body text-muted-foreground text-sm">
                Didn&apos;t get it? Enter your email to resend the link.
              </p>
              <RetroFormField label="Email">
                <RetroInput
                  type="email"
                  autoComplete="email"
                  placeholder="user@example.com"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
              </RetroFormField>
              {resendError && <AuthMessage variant="error" message={resendError} />}
              <TurnstileWidget
                key={turnstileKey}
                siteKey={turnstileSiteKey}
                nonce={nonce}
                onToken={setTurnstileToken}
              />
              <RetroButton type="submit" className="w-full" disabled={resending}>
                {resending ? 'Sending...' : 'Resend verification link'}
              </RetroButton>
            </form>
          )}
        </div>
      )}

      <p className="font-body text-muted-foreground text-center text-xs">
        <Link href="/login" className="text-primary underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
