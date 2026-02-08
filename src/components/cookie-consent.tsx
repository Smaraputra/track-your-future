'use client';

import { useCallback, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { RetroButton } from '@/components/retro-button';

const COOKIE_CONSENT_KEY = 'tyf-cookie-consent';

type ConsentState = 'pending' | 'accepted' | 'declined';

const consentListeners = new Set<() => void>();

function consentSubscribe(callback: () => void) {
  consentListeners.add(callback);
  return () => consentListeners.delete(callback);
}

function getConsentSnapshot(): ConsentState {
  try {
    const value = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (value === 'accepted' || value === 'declined') return value;
    return 'pending';
  } catch {
    return 'pending';
  }
}

function getConsentServerSnapshot(): ConsentState {
  return 'accepted';
}

export function CookieConsent() {
  const state = useSyncExternalStore(
    consentSubscribe,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );

  const setConsent = useCallback((value: 'accepted' | 'declined') => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value);
    } catch {
      // localStorage not available
    }
    consentListeners.forEach((l) => l());
  }, []);

  if (state !== 'pending') return null;

  return (
    <div
      data-testid="cookie-consent"
      className="border-border bg-surface fixed inset-x-0 bottom-0 z-50 border-t p-4"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="font-body text-muted-foreground text-sm">
          We use cookies for authentication and localStorage for UI preferences.
          See our{' '}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
        <div className="flex gap-2">
          <RetroButton size="sm" onClick={() => setConsent('accepted')}>
            Accept
          </RetroButton>
          <RetroButton
            variant="ghost"
            size="sm"
            onClick={() => setConsent('declined')}
          >
            Decline
          </RetroButton>
        </div>
      </div>
    </div>
  );
}

export { COOKIE_CONSENT_KEY };
