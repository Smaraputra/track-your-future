'use client';

import { RetroButton } from '@/components/retro-button';
import { RetroInput } from '@/components/retro-input';

interface StepRoleProps {
  roleName: string;
  roleColor: string;
  onRoleNameChange: (name: string) => void;
  onRoleColorChange: (color: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const PRESET_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
];

export function StepRole({
  roleName,
  roleColor,
  onRoleNameChange,
  onRoleColorChange,
  onNext,
  onBack,
}: StepRoleProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-primary text-lg">First Role</h2>
        <p className="font-body text-muted-foreground text-sm">
          Create a role category to organize your applications (e.g. &quot;Frontend Developer&quot;, &quot;Product Manager&quot;).
          You can skip this step.
        </p>
      </div>

      <div className="space-y-2">
        <label className="font-body text-foreground block text-sm">
          Role Name
        </label>
        <RetroInput
          value={roleName}
          onChange={(e) => onRoleNameChange(e.target.value)}
          placeholder="e.g. Frontend Developer"
        />
      </div>

      <div className="space-y-2">
        <label className="font-body text-foreground block text-sm">
          Color
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`size-7 rounded-full border-2 transition-transform ${
                roleColor === color ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onRoleColorChange(color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <RetroButton variant="ghost" onClick={onBack}>Back</RetroButton>
        <RetroButton onClick={onNext}>
          {roleName ? 'Next' : 'Skip'}
        </RetroButton>
      </div>
    </div>
  );
}
