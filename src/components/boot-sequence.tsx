'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import { bootStore } from '@/lib/boot-store';

const BOOT_LINES = [
  { text: 'TYF BIOS v2.0.26', delay: 0 },
  { text: 'Copyright (C) 2026 Tracked Your Future Systems', delay: 100 },
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

interface BootContextType {
  wasBooted: boolean;
}

const BootContext = createContext<BootContextType>({ wasBooted: false });

export const useBootContext = () => useContext(BootContext);

interface BootSequenceProps {
  children: React.ReactNode;
}

export function BootSequence({ children }: BootSequenceProps) {
  const seen = useSyncExternalStore(
    bootStore.subscribe,
    bootStore.getSnapshot,
    bootStore.getServerSnapshot,
  );

  const [completed, setCompleted] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const [wasBooted, setWasBooted] = useState(false);
  
  // Track if we started with 'seen' already (e.g. refresh)
  // If so, we skip boot sequence and wasBooted remains false (no reveal animation)
  const initialSeenRef = useRef<boolean | null>(null);
  
  // Initialize ref on client mount
  useEffect(() => {
    if (initialSeenRef.current === null) {
      initialSeenRef.current = seen;
    }
  }, [seen]);

  const markSeen = useCallback(() => {
    bootStore.markComplete();
    setCompleted(true);
  }, []);

  useEffect(() => {
    // If we've already seen it (persisted) or completed this session, stop.
    if (seen || completed) return;

    // If we are running this effect, it means we are booting.
    // So when we finish, we should consider it "booted".
    setWasBooted(true);

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

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [seen, completed, markSeen]);

  // If already seen from start (refresh), just show children immediately
  // If running sequence, show children only after completion
  const showChildren = seen || completed;

  if (showChildren) {
    return (
      <BootContext.Provider value={{ wasBooted }}>
        {children}
      </BootContext.Provider>
    );
  }

  return (
    <div
      data-testid="boot-sequence"
      className="min-h-screen bg-background bg-grid p-6 font-body text-sm cursor-pointer select-none"
      onClick={markSeen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key !== 'Tab') markSeen();
      }}
    >
      <div className="mx-auto max-w-2xl">
        {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
          <div key={i} className="text-primary leading-relaxed whitespace-pre-wrap">
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

export { BOOT_LINES };
export { BOOT_SEEN_KEY } from '@/lib/boot-store';