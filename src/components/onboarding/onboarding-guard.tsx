'use client';

import { usePathname, redirect } from 'next/navigation';

interface OnboardingGuardProps {
  completed: boolean;
  children: React.ReactNode;
}

export function OnboardingGuard({ completed, children }: OnboardingGuardProps) {
  const pathname = usePathname();

  if (!completed && pathname !== '/onboarding') {
    redirect('/onboarding');
  }

  return <>{children}</>;
}
