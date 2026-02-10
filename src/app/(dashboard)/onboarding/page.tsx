import { auth } from '@/auth';
import { RetroWindow } from '@/components/retro-window';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

export default async function OnboardingPage() {
  const session = await auth();

  return (
    <RetroWindow title="sys://initialize">
      <OnboardingWizard
        initialName={session?.user?.name ?? ''}
        initialEmail={session?.user?.email ?? ''}
      />
    </RetroWindow>
  );
}
