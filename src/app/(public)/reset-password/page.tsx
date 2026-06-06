import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

import { auth } from '@/auth';
import { RetroWindow } from '@/components/retro-window';
import { MatrixRain } from '@/components/matrix-rain';
import { getTurnstileSiteKey } from '@/lib/turnstile';
import { ResetPasswordForm } from './reset-password-form';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden p-4">
      <MatrixRain />
      <RetroWindow
        title="sys://auth/reset-password"
        className="relative z-10 w-full max-w-sm"
      >
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-primary text-2xl">Reset Password</h1>
            <p className="font-body text-muted-foreground text-sm">
              Choose a new password for your account.
            </p>
          </div>
          {token ? (
            <ResetPasswordForm
              token={token}
              turnstileSiteKey={turnstileSiteKey}
              nonce={nonce}
            />
          ) : (
            <p className="font-body text-destructive text-sm">
              This reset link is missing or invalid. Request a new one from the{' '}
              <Link href="/forgot-password" className="text-primary underline">
                forgot-password page
              </Link>
              .
            </p>
          )}
        </div>
      </RetroWindow>
    </div>
  );
}
