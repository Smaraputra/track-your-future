import { auth } from '@/auth';
import { RetroWindow } from '@/components/retro-window';
import { MatrixRain } from '@/components/matrix-rain';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default async function OnboardingPage() {
  const session = await auth();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <MatrixRain />
      <RetroWindow title="sys://initialize" className="relative z-10 w-full max-w-lg">
        <OnboardingWizard
          initialName={session?.user?.name ?? ''}
          initialEmail={session?.user?.email ?? ''}
        />
      </RetroWindow>
    </div>
  );
}
