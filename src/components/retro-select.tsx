'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface RetroSelectOption {
  value: string;
  label: string;
}

interface RetroSelectProps {
  options: RetroSelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RetroSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Select...',
  className,
  disabled,
}: RetroSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          'font-body bg-background border-input focus-visible:shadow-[0_0_8px_var(--primary)]',
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="font-body bg-surface border-border">
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            className="focus:bg-accent focus:text-accent-foreground"
          >
            <span className="text-muted-foreground mr-1">&gt;</span>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
