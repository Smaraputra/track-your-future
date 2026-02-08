'use client';

import { useCallback, useSyncExternalStore } from 'react';

const CRT_STORAGE_KEY = 'tyf-crt';

const crtListeners = new Set<() => void>();

function crtSubscribe(callback: () => void) {
  crtListeners.add(callback);
  return () => crtListeners.delete(callback);
}

function getCRTSnapshot(): boolean {
  try {
    return localStorage.getItem(CRT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function getCRTServerSnapshot(): boolean {
  return false;
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
