'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const BOOT_SEEN_KEY = 'tyf-boot-seen';

const bootListeners = new Set<() => void>();

function bootSubscribe(callback: () => void) {
  bootListeners.add(callback);
  return () => bootListeners.delete(callback);
}

function getBootSeenSnapshot(): boolean {
  try {
    return localStorage.getItem(BOOT_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

function getBootSeenServerSnapshot(): boolean {
  return true;
}

const BOOT_LINES = [
  { text: 'TYF BIOS v2.0.26', delay: 0 },
  { text: 'Copyright (C) 2026 Track Your Future Systems', delay: 100 },
  { text: '', delay: 200 },
  { text: 'Checking memory... 640K OK', delay: 400 },
  { text: 'Extended memory: 2048K OK', delay: 600 },
  { text: '', delay: 700 },
  { text: 'Initializing modules:', delay: 900 },
  { text: '  [OK] Application tracker', delay: 1100 },
  { text: '  [OK] Document manager', delay: 1300 },
  { text: '  [OK] AI analysis engine', delay: 1500 },
  { text: '  [OK] Status pipeline', delay: 1700 },
  { text: '  [OK] Analytics subsystem', delay: 1900 },
  { text: '  [OK] Form template registry', delay: 2100 },
  { text: '', delay: 2200 },
  { text: 'All systems operational.', delay: 2400 },
  { text: 'Type HELP for assistance or press any key to continue...', delay: 2700 },
];

const TOTAL_DURATION = 3200;

interface BootSequenceProps {
  children: React.ReactNode;
}

export function BootSequence({ children }: BootSequenceProps) {
  const seen = useSyncExternalStore(
    bootSubscribe,
    getBootSeenSnapshot,
    getBootSeenServerSnapshot,
  );

  const [completed, setCompleted] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(BOOT_SEEN_KEY, 'true');
    } catch {
      // localStorage not available
    }
    bootListeners.forEach((l) => l());
    setCompleted(true);
  }, []);

  useEffect(() => {
    if (seen || completed) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < BOOT_LINES.length; i++) {
      const timer = setTimeout(() => {
        setVisibleLines(i + 1);
      }, BOOT_LINES[i].delay);
      timers.push(timer);
    }

    const completeTimer = setTimeout(() => {
      markSeen();
    }, TOTAL_DURATION);
    timers.push(completeTimer);

    timersRef.current = timers;

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [seen, completed, markSeen]);

  if (seen || completed) {
    return <>{children}</>;
  }

  return (
    <div
      data-testid="boot-sequence"
      className="min-h-screen bg-background bg-grid p-6 font-body text-sm cursor-pointer"
      onClick={markSeen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key !== 'Tab') markSeen();
      }}
    >
      <div className="mx-auto max-w-2xl">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="text-primary leading-relaxed">
            {line.text || '\u00A0'}
          </div>
        ))}
        {visibleLines > 0 && visibleLines < BOOT_LINES.length && (
          <span className="text-primary animate-blink">_</span>
        )}
      </div>
    </div>
  );
}

export { BOOT_SEEN_KEY, BOOT_LINES };
