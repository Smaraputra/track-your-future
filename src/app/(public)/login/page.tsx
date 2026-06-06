import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { RetroWindow } from '@/components/retro-window';
import { MatrixRain } from '@/components/matrix-rain';
import { getTurnstileSiteKey } from '@/lib/turnstile';
import { LoginForm } from './login-form';

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password. If you recently registered, check your email for a verification link.',
  OAuthAccountNotLinked: 'An account already exists with this email using a different sign-in method.',
  UnverifiedEmail: 'An account with this email exists but has not been verified. Check your inbox for the verification link before signing in with a social provider.',
  turnstile_failed: 'Verification failed. Please try again.',
  Default: 'An authentication error occurred. Please try again.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const params = await searchParams;
  const errorParam = typeof params.error === 'string' ? params.error : undefined;
  const codeParam = typeof params.code === 'string' ? params.code : undefined;
  // NextAuth surfaces a CredentialsSignin subclass's `code` as ?code=...; prefer it when known.
  const errorKey =
    codeParam && ERROR_MESSAGES[codeParam] ? codeParam : errorParam;
  const callbackUrl = typeof params.callbackUrl === 'string' ? params.callbackUrl : undefined;
  const initialError = errorKey
    ? ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.Default
    : undefined;
  const initialSuccess =
    params.reset === 'success'
      ? 'Password updated. Sign in with your new password.'
      : params.verified === '1'
        ? 'Email verified. Sign in to access your account.'
        : undefined;

  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden p-4">
      <MatrixRain />
      <RetroWindow title="sys://auth/login" className="relative z-10 w-full max-w-sm">
        <LoginForm
          initialError={initialError}
          initialSuccess={initialSuccess}
          callbackUrl={callbackUrl}
          turnstileSiteKey={turnstileSiteKey}
          nonce={nonce}
        />
      </RetroWindow>
    </div>
  );
}
