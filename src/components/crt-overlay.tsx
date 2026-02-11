'use client';

import { useCallback, useSyncExternalStore } from 'react';

const CRT_STORAGE_KEY = 'tyf-crt-overlay';

const crtListeners = new Set<() => void>();

function crtSubscribe(callback: () => void) {
  crtListeners.add(callback);
  return () => crtListeners.delete(callback);
}

function getCRTSnapshot(): boolean {
  try {
    const stored = localStorage.getItem(CRT_STORAGE_KEY);
    if (stored === null) return true; // enabled by default
    return stored === 'true';
  } catch {
    return true;
  }
}

function getCRTServerSnapshot(): boolean {
  return true;
}

export function CRTOverlay() {
  const enabled = useSyncExternalStore(
    crtSubscribe,
    getCRTSnapshot,
    getCRTServerSnapshot
  );

  if (!enabled) return null;

  return <div className="crt-overlay" aria-hidden="true" />;
}

export function useCRTOverlay() {
  const enabled = useSyncExternalStore(
    crtSubscribe,
    getCRTSnapshot,
    getCRTServerSnapshot
  );

  const toggle = useCallback(() => {
    const next = !getCRTSnapshot();
    try {
      localStorage.setItem(CRT_STORAGE_KEY, String(next));
    } catch {
      // localStorage not available
    }
    crtListeners.forEach((l) => l());
  }, []);

  return { enabled, toggle };
}
