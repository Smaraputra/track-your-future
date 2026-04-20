import { redirect } from 'next/navigation';
import Link from 'next/link';

import { auth } from '@/auth';
import { RetroWindow } from '@/components/retro-window';
import { MatrixRain } from '@/components/matrix-rain';
import { ForgotPasswordForm } from './forgot-password-form';

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center overflow-hidden p-4">
      <MatrixRain />
      <RetroWindow
        title="sys://auth/forgot-password"
        className="relative z-10 w-full max-w-sm"
      >
        <div className="space-y-6">
          <div>
            <h1 className="font-heading text-primary text-2xl">Forgot Password</h1>
            <p className="font-body text-muted-foreground text-sm">
              Enter your account email to receive a reset link.
            </p>
          </div>
          <ForgotPasswordForm />
          <p className="font-body text-muted-foreground text-xs">
            Remembered it?{' '}
            <Link href="/login" className="text-primary underline">
              Back to login
            </Link>
          </p>
        </div>
      </RetroWindow>
    </div>
  );
}
