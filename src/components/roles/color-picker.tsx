'use client';

import { Check } from 'lucide-react';

import { ROLE_COLORS } from '@/lib/roles/constants';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ROLE_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={cn(
            'relative flex size-8 items-center justify-center rounded-md border-2 transition-all',
            value === color.value
              ? 'border-foreground scale-110'
              : 'border-transparent hover:border-muted-foreground/50',
          )}
          style={{ backgroundColor: color.value }}
          title={color.label}
          aria-label={`Select ${color.label}`}
          aria-pressed={value === color.value}
        >
          {value === color.value && (
            <Check className="size-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
          )}
        </button>
      ))}
    </div>
  );
}
