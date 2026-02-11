'use client';

import { redirect } from 'next/navigation';

interface OnboardingGuardProps {
  completed: boolean;
  children: React.ReactNode;
}

export function OnboardingGuard({ completed, children }: OnboardingGuardProps) {
  if (!completed) {
    redirect('/onboarding');
  }

  return <>{children}</>;
}
