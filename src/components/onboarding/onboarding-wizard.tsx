'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepName } from './step-name';
import { StepRole } from './step-role';
import { StepCvUpload } from './step-cv-upload';
import { StepSummary } from './step-summary';

const STEPS = ['name', 'role', 'cv', 'summary'] as const;
type Step = typeof STEPS[number];

interface OnboardingWizardProps {
  initialName: string;
  initialEmail: string;
}

interface OnboardingData {
  name: string;
  roleName: string;
  roleColor: string;
  cvUploaded: boolean;
}

export function OnboardingWizard({
  initialName,
  initialEmail,
}: OnboardingWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [data, setData] = useState<OnboardingData>({
    name: initialName,
    roleName: '',
    roleColor: '#22c55e',
    cvUploaded: false,
  });
  const [loading, setLoading] = useState(false);

  const stepIndex = STEPS.indexOf(currentStep);

  const goNext = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex]);
    }
  }, [stepIndex]);

  const goBack = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  }, [stepIndex]);

  const handleComplete = useCallback(async () => {
    setLoading(true);
    try {
      // Update name if changed
      if (data.name && data.name !== initialName) {
        await fetch('/api/settings/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name }),
        });
      }

      // Create role if provided
      if (data.roleName) {
        await fetch('/api/roles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.roleName, color: data.roleColor }),
        });
      }

      // Mark onboarding complete
      await fetch('/api/settings/onboarding-complete', { method: 'POST' });

      router.replace('/dashboard');
      router.refresh();
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [data, initialName, router]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Progress */}
      <div className="font-body text-sm">
        <span className="text-primary text-shadow-glow">INIT</span>{' '}
        <span className="text-muted-foreground">
          [{STEPS.map((_, i) => (i <= stepIndex ? '#' : '.')).join('')}]
        </span>{' '}
        <span className="text-foreground">step {stepIndex + 1}/{STEPS.length}</span>
      </div>

      {/* Step content */}
      {currentStep === 'name' && (
        <StepName
          name={data.name}
          email={initialEmail}
          onNameChange={(name) => setData((d) => ({ ...d, name }))}
          onNext={goNext}
        />
      )}
      {currentStep === 'role' && (
        <StepRole
          roleName={data.roleName}
          roleColor={data.roleColor}
          onRoleNameChange={(roleName) => setData((d) => ({ ...d, roleName }))}
          onRoleColorChange={(roleColor) => setData((d) => ({ ...d, roleColor }))}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {currentStep === 'cv' && (
        <StepCvUpload
          onUploaded={() => setData((d) => ({ ...d, cvUploaded: true }))}
          onNext={goNext}
          onBack={goBack}
        />
      )}
      {currentStep === 'summary' && (
        <StepSummary
          data={data}
          loading={loading}
          onComplete={handleComplete}
          onBack={goBack}
        />
      )}
    </div>
  );
}
