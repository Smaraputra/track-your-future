import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { RetroWindow } from '@/components/retro-window';
import { RegisterForm } from './register-form';

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <RetroWindow title="sys://auth/register" className="w-full max-w-sm">
        <RegisterForm />
      </RetroWindow>
    </div>
  );
}
