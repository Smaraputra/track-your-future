'use client';

import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';

interface StepNameProps {
  name: string;
  email: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
}

export function StepName({ name, email, onNameChange, onNext }: StepNameProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-body text-muted-foreground text-xs mb-1">user@tyf:~$ init --step=identity</p>
        <h2 className="font-heading text-primary text-shadow-glow text-lg">Welcome</h2>
        <p className="font-body text-muted-foreground text-sm">
          Let&apos;s set up your profile. Signed in as {email}.
        </p>
      </div>

      <div className="space-y-2">
        <label className="font-body text-foreground block text-sm">
          Display Name
        </label>
        <RetroInput
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Your name"
        />
      </div>

      <div className="flex justify-end">
        <RetroButton onClick={onNext}>Next</RetroButton>
      </div>
    </div>
  );
}
