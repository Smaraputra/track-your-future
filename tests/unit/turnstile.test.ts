import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { buildContentSecurityPolicy } from '@/lib/security/csp';
import {
  getTurnstileSiteKey,
  isTurnstileEnabled,
  verifyTurnstile,
} from '@/lib/turnstile';

function mockFetchJson(payload: unknown, ok = true) {
  return vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    json: async () => payload,
  } as Response);
}

describe('verifyTurnstile', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('is disabled (returns success) and skips the network when no secret is set', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await verifyTurnstile('any-token');
    expect(res.success).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fails without calling Cloudflare when the token is missing', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchSpy = vi.spyOn(global, 'fetch');
    const res = await verifyTurnstile(undefined);
    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain('missing-input-response');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('succeeds when Cloudflare returns success', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    const fetchSpy = mockFetchJson({ success: true });
    const res = await verifyTurnstile('tok', '1.2.3.4');
    expect(res.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('fails with error codes when Cloudflare rejects', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    mockFetchJson({ success: false, 'error-codes': ['invalid-input-response'] });
    const res = await verifyTurnstile('tok');
    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain('invalid-input-response');
  });

  it('fails closed on non-ok HTTP responses', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    mockFetchJson({}, false);
    const res = await verifyTurnstile('tok');
    expect(res.success).toBe(false);
  });

  it('fails closed on network error', async () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('network'));
    const res = await verifyTurnstile('tok');
    expect(res.success).toBe(false);
  });
});

describe('turnstile env helpers', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('reports enabled and exposes the site key when configured', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
    vi.stubEnv('TURNSTILE_SITE_KEY', 'site-key');
    expect(isTurnstileEnabled()).toBe(true);
    expect(getTurnstileSiteKey()).toBe('site-key');
  });

  it('reports disabled when no secret is set', () => {
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');
    expect(isTurnstileEnabled()).toBe(false);
  });
});

describe('CSP allows Cloudflare Turnstile', () => {
  const csp = buildContentSecurityPolicy('test-nonce');
  const directive = (name: string) =>
    csp.split(';').find((d) => d.trim().startsWith(name)) ?? '';

  it('whitelists challenges.cloudflare.com in frame-src and connect-src', () => {
    expect(directive('frame-src')).toContain('https://challenges.cloudflare.com');
    expect(directive('connect-src')).toContain('https://challenges.cloudflare.com');
  });

  it('keeps the per-request nonce + strict-dynamic on script-src', () => {
    expect(directive('script-src')).toContain("'nonce-test-nonce'");
    expect(directive('script-src')).toContain("'strict-dynamic'");
  });
});

describe('turnstile is wired into the auth/email endpoints', () => {
  const read = (p: string) => readFileSync(resolve(__dirname, '../../', p), 'utf-8');

  const routes = [
    'src/app/api/auth/register/route.ts',
    'src/app/api/auth/password-reset/request/route.ts',
    'src/app/api/auth/password-reset/confirm/route.ts',
    'src/app/api/auth/verify-email/route.ts',
    'src/app/api/auth/verify-email/resend/route.ts',
  ];

  it.each(routes)('%s verifies the turnstile token', (p) => {
    const src = read(p);
    expect(src).toContain("from '@/lib/turnstile'");
    expect(src).toContain('verifyTurnstile(body?.turnstileToken');
  });

  it('login authorize verifies turnstile and throws a coded error', () => {
    const src = read('src/auth.ts');
    expect(src).toContain('verifyTurnstile');
    expect(src).toContain('turnstileToken');
    expect(src).toContain("code = 'turnstile_failed'");
  });
});
