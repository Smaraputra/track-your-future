import Link from 'next/link';
import { RetroWindow } from '@/components/retro-window';
import { AuthMessage } from '@/components/auth/auth-message';
import { ResetPasswordConfirmForm } from './reset-password-confirm-form';

export default async function ResetPasswordConfirmPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
        <RetroWindow title="sys://auth/reset/confirm" className="w-full max-w-sm">
          <div className="space-y-4">
            <h1 className="font-heading text-primary text-2xl">
              Invalid Link
            </h1>
            <AuthMessage
              variant="error"
              message="No reset token provided. Please request a new password reset link."
            />
            <p className="font-body text-center text-sm">
              <Link href="/reset-password" className="text-primary hover:underline">
                Request reset link
              </Link>
            </p>
          </div>
        </RetroWindow>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://auth/reset/confirm" className="w-full max-w-sm">
        <ResetPasswordConfirmForm token={token} />
      </RetroWindow>
    </div>
  );
}
