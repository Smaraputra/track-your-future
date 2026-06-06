import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { RetroWindow } from '@/components/retro-window';
import { MatrixRain } from '@/components/matrix-rain';
import { getTurnstileSiteKey } from '@/lib/turnstile';
import { RegisterForm } from './register-form';

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const turnstileSiteKey = getTurnstileSiteKey();

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden p-4">
      <MatrixRain />
      <RetroWindow
        title="sys://auth/register"
        className="relative z-10 w-full max-w-sm"
      >
        <RegisterForm turnstileSiteKey={turnstileSiteKey} nonce={nonce} />
      </RetroWindow>
    </div>
  );
}
