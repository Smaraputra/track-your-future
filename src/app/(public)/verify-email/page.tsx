import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { RetroWindow } from '@/components/retro-window';
import { MatrixRain } from '@/components/matrix-rain';
import { getTurnstileSiteKey } from '@/lib/turnstile';
import { VerifyEmailClient } from './verify-email-client';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;
  const email = typeof params.email === 'string' ? params.email : undefined;
  const status = typeof params.status === 'string' ? params.status : undefined;
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden p-4">
      <MatrixRain />
      <RetroWindow
        title="sys://auth/verify-email"
        className="relative z-10 w-full max-w-sm"
      >
        <VerifyEmailClient
          token={token}
          email={email}
          status={status}
          turnstileSiteKey={turnstileSiteKey}
          nonce={nonce}
        />
      </RetroWindow>
    </div>
  );
}
