import Link from 'next/link';
import { RetroWindow } from '@/components/retro-window';
import { AuthMessage } from '@/components/auth/auth-message';
import { verifyEmail } from '@/lib/auth/verify-email';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const token = typeof params.token === 'string' ? params.token : undefined;

  let result: { success: boolean; error?: string };

  if (!token) {
    result = { success: false, error: 'No verification token provided.' };
  } else {
    result = await verifyEmail(token);
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://auth/verify" className="w-full max-w-sm">
        <div className="space-y-4">
          <h1 className="font-heading text-primary text-2xl">
            Email Verification
          </h1>

          {result.success ? (
            <>
              <AuthMessage
                variant="success"
                message="Your email has been verified. You can now log in."
              />
              <p className="font-body text-center text-sm">
                <Link href="/login" className="text-primary hover:underline">
                  Go to login
                </Link>
              </p>
            </>
          ) : (
            <>
              <AuthMessage
                variant="error"
                message={result.error || 'Verification failed.'}
              />
              <p className="font-body text-center text-sm">
                <Link href="/register" className="text-primary hover:underline">
                  Register again
                </Link>
              </p>
            </>
          )}
        </div>
      </RetroWindow>
    </div>
  );
}
