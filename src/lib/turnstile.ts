const SITEVERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export interface TurnstileVerifyResult {
  success: boolean;
  errorCodes?: string[];
}

/** Public site key, read at runtime (never module-level so it is not inlined at build). */
export function getTurnstileSiteKey(): string | undefined {
  return process.env.TURNSTILE_SITE_KEY || undefined;
}

export function getTurnstileSecretKey(): string | undefined {
  return process.env.TURNSTILE_SECRET_KEY || undefined;
}

/** Turnstile is enforced only when a secret key is configured (prod). */
export function isTurnstileEnabled(): boolean {
  return !!getTurnstileSecretKey();
}

/**
 * Verify a Turnstile token against Cloudflare siteverify. When no secret key is
 * configured the challenge is disabled and this returns success (keeps local dev
 * and tests working). Network/parse failures fail closed.
 */
export async function verifyTurnstile(
  token: string | null | undefined,
  ip?: string,
): Promise<TurnstileVerifyResult> {
  const secret = getTurnstileSecretKey();
  if (!secret) return { success: true };

  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] };
  }

  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', token);
    if (ip) body.set('remoteip', ip);

    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!res.ok) return { success: false, errorCodes: ['bad-request'] };

    const data = (await res.json()) as {
      success: boolean;
      'error-codes'?: string[];
    };
    return { success: !!data.success, errorCodes: data['error-codes'] };
  } catch {
    return { success: false, errorCodes: ['internal-error'] };
  }
}
