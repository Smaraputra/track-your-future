'use client';

import { Turnstile } from '@marsidev/react-turnstile';

interface TurnstileWidgetProps {
  /** When absent, Turnstile is disabled and the widget renders nothing. */
  siteKey?: string;
  /** Per-request CSP nonce so the injected script satisfies 'strict-dynamic'. */
  nonce?: string;
  /** Called with the solved token, or null on error/expiry. */
  onToken: (token: string | null) => void;
  className?: string;
}

/**
 * Thin wrapper over Cloudflare Turnstile. To force a reset, remount via a
 * changing `key` prop rather than an imperative ref.
 */
export function TurnstileWidget({
  siteKey,
  nonce,
  onToken,
  className,
}: TurnstileWidgetProps) {
  if (!siteKey) return null;

  return (
    <div className={className}>
      <Turnstile
        siteKey={siteKey}
        options={{ theme: 'dark' }}
        scriptOptions={nonce ? { nonce } : undefined}
        onSuccess={(token) => onToken(token)}
        onError={() => onToken(null)}
        onExpire={() => onToken(null)}
      />
    </div>
  );
}
