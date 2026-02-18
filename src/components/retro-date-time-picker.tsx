'use client';

import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RetroButton } from '@/components/retro-button';
import { cn } from '@/lib/utils';

interface RetroDateTimePickerProps {
  value: string; // ISO string or empty
  onChange: (value: string) => void;
  disabled?: boolean;
}

function parseValue(value: string): { date: Date | undefined; hour: string; minute: string } {
  if (!value) {
    return { date: undefined, hour: '12', minute: '00' };
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) {
    return { date: undefined, hour: '12', minute: '00' };
  }
  return {
    date: d,
    hour: String(d.getHours()).padStart(2, '0'),
    minute: String(d.getMinutes()).padStart(2, '0'),
  };
}

function buildIsoString(date: Date, hour: string, minute: string): string {
  const d = new Date(date);
  d.setHours(parseInt(hour, 10) || 0);
  d.setMinutes(parseInt(minute, 10) || 0);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d.toISOString();
}

function formatDisplay(value: string): string {
  if (!value) return 'Pick date & time';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Pick date & time';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

export function RetroDateTimePicker({
  value,
  onChange,
  disabled,
}: RetroDateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseValue(value);
  const [hour, setHour] = useState(parsed.hour);
  const [minute, setMinute] = useState(parsed.minute);

  function handleDateSelect(date: Date | undefined) {
    if (!date) return;
    const iso = buildIsoString(date, hour, minute);
    onChange(iso);
  }

  function handleHourChange(newHour: string) {
    setHour(newHour);
    if (parsed.date) {
      onChange(buildIsoString(parsed.date, newHour, minute));
    }
  }

  function handleMinuteChange(newMinute: string) {
    setMinute(newMinute);
    if (parsed.date) {
      onChange(buildIsoString(parsed.date, hour, newMinute));
    }
  }

  function handleClear() {
    onChange('');
    setHour('12');
    setMinute('00');
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <RetroButton
          type="button"
          variant="secondary"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          <span className="truncate">{formatDisplay(value)}</span>
        </RetroButton>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsed.date}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="border-border border-t px-3 py-2">
          <div className="flex items-center gap-2">
            <label className="font-body text-muted-foreground text-xs">Time:</label>
            <select
              value={hour}
              onChange={(e) => handleHourChange(e.target.value)}
              className="font-body bg-background border-input rounded-md border px-2 py-1 text-sm"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">:</span>
            <select
              value={minute}
              onChange={(e) => handleMinuteChange(e.target.value)}
              className="font-body bg-background border-input rounded-md border px-2 py-1 text-sm"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="font-body text-muted-foreground mt-2 text-xs underline hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
