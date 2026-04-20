import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it, vi, beforeEach } from 'vitest';

const ROOT = resolve(__dirname, '../..');

function readRoute(path: string): string {
  return readFileSync(resolve(ROOT, path), 'utf-8');
}

describe('P0-1: Status update transaction includes userId in WHERE', () => {
  const source = readRoute('src/app/api/applications/[applicationId]/status/route.ts');

  it('uses and() with userId in the UPDATE where clause inside transaction', () => {
    // The transaction's .update().set().where() must include userId
    const txSection = source.slice(source.indexOf('db.transaction'));
    expect(txSection).toContain('eq(applications.userId, session.user.id)');
    expect(txSection).toContain('and(');
  });
});

describe('P0-2: Polar webhook secret validation', () => {
  const source = readRoute('src/app/api/webhooks/polar/route.ts');

  it('reads POLAR_WEBHOOK_SECRET at module level', () => {
    expect(source).toContain('const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET');
  });

  it('returns 503 when secret is not configured', () => {
    expect(source).toContain('!POLAR_WEBHOOK_SECRET');
    expect(source).toContain('Polar webhooks not configured');
    expect(source).toContain('status: 503');
  });

  it('does not fall back to empty string', () => {
    expect(source).not.toContain("?? ''");
  });
});

describe('P0-3: Security headers in next.config.ts', () => {
  const source = readRoute('next.config.ts');

  it('sets X-Frame-Options DENY', () => {
    expect(source).toContain('X-Frame-Options');
    expect(source).toContain('DENY');
  });

  it('sets X-Content-Type-Options nosniff', () => {
    expect(source).toContain('X-Content-Type-Options');
    expect(source).toContain('nosniff');
  });

  it('sets Referrer-Policy', () => {
    expect(source).toContain('Referrer-Policy');
    expect(source).toContain('strict-origin-when-cross-origin');
  });

  it('sets Permissions-Policy', () => {
    expect(source).toContain('Permissions-Policy');
    expect(source).toContain('camera=()');
    expect(source).toContain('microphone=()');
  });

  it('sets HSTS', () => {
    expect(source).toContain('Strict-Transport-Security');
    expect(source).toContain('max-age=63072000');
    expect(source).toContain('includeSubDomains');
  });

  it('delegates Content-Security-Policy to the per-request middleware', () => {
    // CSP is now emitted by src/proxy.ts with a nonce. The static config
    // must not set a conflicting CSP header entry.
    expect(source).not.toMatch(/key:\s*['"]Content-Security-Policy['"]/);
  });

  it('applies headers to all routes', () => {
    expect(source).toContain("source: '/(.*)'");
  });
});

describe('P0-3b: Nonce-based CSP in proxy middleware', () => {
  const cspSource = readRoute('src/lib/security/csp.ts');
  const proxySource = readRoute('src/proxy.ts');

  it('generates a fresh nonce per request', () => {
    expect(cspSource).toContain('randomBytes(16)');
    expect(cspSource).toContain("toString('base64')");
  });

  it('drops unsafe-inline and unsafe-eval from script-src', () => {
    expect(cspSource).not.toMatch(/script-src[^']*'unsafe-inline'/);
    expect(cspSource).not.toMatch(/script-src[^']*'unsafe-eval'/);
    expect(cspSource).toContain("'nonce-${nonce}'");
    expect(cspSource).toContain("'strict-dynamic'");
  });

  it('retains the baseline hardening directives', () => {
    expect(cspSource).toContain("default-src 'self'");
    expect(cspSource).toContain("object-src 'none'");
    expect(cspSource).toContain("base-uri 'self'");
    expect(cspSource).toContain("form-action 'self'");
    expect(cspSource).toContain("frame-ancestors 'none'");
  });

  it('allows Stripe and Polar in connect-src / frame-src', () => {
    expect(cspSource).toContain('checkout.stripe.com');
    expect(cspSource).toContain('api.stripe.com');
    expect(cspSource).toContain('*.polar.sh');
  });

  it('proxy wraps auth and emits the nonce + CSP header', () => {
    expect(proxySource).toContain('auth((request)');
    expect(proxySource).toContain('generateCspNonce');
    expect(proxySource).toContain('buildContentSecurityPolicy');
    expect(proxySource).toContain("requestHeaders.set('x-nonce', nonce)");
    expect(proxySource).toContain("response.headers.set('Content-Security-Policy', csp)");
  });
});

describe('P1-1: Rate limiting on critical endpoints', () => {
  const configs = readRoute('src/lib/rate-limit-configs.ts');

  it('exports PASSWORD_CHANGE_LIMIT with failClosed', () => {
    expect(configs).toContain('PASSWORD_CHANGE_LIMIT');
    expect(configs).toContain('failClosed: true');
  });

  it('exports ACCOUNT_DELETE_LIMIT with failClosed', () => {
    expect(configs).toContain('ACCOUNT_DELETE_LIMIT');
  });

  it('exports configs for all planned endpoints', () => {
    expect(configs).toContain('CHECKOUT_LIMIT');
    expect(configs).toContain('TRIAL_LIMIT');
    expect(configs).toContain('PRESIGN_LIMIT');
    expect(configs).toContain('EXPORT_LIMIT');
    expect(configs).toContain('AI_BURST_LIMIT');
  });

  const routes = [
    { name: 'change-password', path: 'src/app/api/settings/change-password/route.ts', config: 'PASSWORD_CHANGE_LIMIT' },
    { name: 'account delete', path: 'src/app/api/settings/account/route.ts', config: 'ACCOUNT_DELETE_LIMIT' },
    { name: 'checkout', path: 'src/app/api/checkout/route.ts', config: 'CHECKOUT_LIMIT' },
    { name: 'billing trial', path: 'src/app/api/billing/trial/route.ts', config: 'TRIAL_LIMIT' },
    { name: 'presign', path: 'src/app/api/documents/presign/route.ts', config: 'PRESIGN_LIMIT' },
    { name: 'export', path: 'src/app/api/settings/export/route.ts', config: 'EXPORT_LIMIT' },
    { name: 'AI parse-cv', path: 'src/app/api/ai/parse-cv/route.ts', config: 'AI_BURST_LIMIT' },
    { name: 'AI extract-jd', path: 'src/app/api/ai/extract-jd/route.ts', config: 'AI_BURST_LIMIT' },
    { name: 'AI match', path: 'src/app/api/ai/match/route.ts', config: 'AI_BURST_LIMIT' },
    { name: 'AI cover-letter', path: 'src/app/api/ai/cover-letter/route.ts', config: 'AI_BURST_LIMIT' },
    { name: 'AI interview-prep', path: 'src/app/api/ai/interview-prep/route.ts', config: 'AI_BURST_LIMIT' },
    { name: 'AI resume-suggestions', path: 'src/app/api/ai/resume-suggestions/route.ts', config: 'AI_BURST_LIMIT' },
  ];

  for (const route of routes) {
    it(`${route.name} imports and uses ${route.config}`, () => {
      const source = readRoute(route.path);
      expect(source).toContain('checkRateLimit');
      expect(source).toContain(route.config);
      expect(source).toContain('status: 429');
      expect(source).toContain('Retry-After');
    });
  }
});

describe('P1-2: Rate limiter failClosed option', () => {
  it('blocks when Redis unavailable and failClosed is true', async () => {
    vi.doMock('@/lib/redis', () => ({ redis: null }));
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const result = await checkRateLimit('test-key', {
      maxRequests: 5,
      windowSeconds: 60,
      failClosed: true,
    });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('allows when Redis unavailable and failClosed is false', async () => {
    vi.doMock('@/lib/redis', () => ({ redis: null }));
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const result = await checkRateLimit('test-key', {
      maxRequests: 5,
      windowSeconds: 60,
      failClosed: false,
    });
    expect(result.allowed).toBe(true);
  });

  beforeEach(() => {
    vi.resetModules();
  });

  it('blocks on Redis error when failClosed is true', async () => {
    const mockPipeline = {
      zremrangebyscore: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      exec: vi.fn().mockRejectedValueOnce(new Error('Redis down')),
    };
    vi.doMock('@/lib/redis', () => ({
      redis: { pipeline: vi.fn(() => mockPipeline) },
    }));
    const { checkRateLimit } = await import('@/lib/rate-limit');

    const result = await checkRateLimit('test-key', {
      maxRequests: 5,
      windowSeconds: 60,
      failClosed: true,
    });
    expect(result.allowed).toBe(false);
  });
});

describe('P1-3: Timing-safe cron secret comparison', () => {
  const source = readRoute('src/app/api/cron/detect-stale/route.ts');

  it('imports timingSafeEqual from crypto', () => {
    expect(source).toContain("import { timingSafeEqual } from 'crypto'");
  });

  it('uses timingSafeEqual for secret comparison', () => {
    expect(source).toContain('timingSafeEqual(');
    expect(source).toContain('Buffer.from(');
  });

  it('checks length before timingSafeEqual (prevents throw on mismatch)', () => {
    expect(source).toContain('authHeader.length !== expected.length');
  });
});

describe('P1-4: IP extraction uses rightmost x-forwarded-for', () => {
  const source = readRoute('src/lib/auth/get-ip.ts');

  it('takes the last entry from x-forwarded-for', () => {
    expect(source).toContain('parts[parts.length - 1]');
  });

  it('does not take the first entry (attacker-controlled)', () => {
    expect(source).not.toContain("split(',')[0]");
  });

  it('documents the deployment assumption', () => {
    expect(source).toContain('rightmost');
    expect(source).toContain('reverse proxy');
  });
});

describe('P1-5: Enum query param validation', () => {
  it('applications route validates status filter against enum', () => {
    const source = readRoute('src/app/api/applications/route.ts');
    expect(source).toContain('applicationStatusEnum.enumValues.includes');
    expect(source).toContain('Invalid status filter');
    expect(source).toContain('status: 400');
    expect(source).not.toMatch(/statusFilter as never/);
  });

  it('documents route validates type filter against enum', () => {
    const source = readRoute('src/app/api/documents/route.ts');
    expect(source).toContain('documentTypeEnum.enumValues.includes');
    expect(source).toContain('Invalid type filter');
    expect(source).toContain('status: 400');
    expect(source).not.toMatch(/typeFilter as never/);
  });
});

describe('P1-6: Health endpoint does not leak infrastructure details', () => {
  const source = readRoute('src/app/api/health/route.ts');

  it('does not include latency measurements', () => {
    expect(source).not.toContain('latencyMs');
    expect(source).not.toContain('pgStart');
    expect(source).not.toContain('redisStart');
  });

  it('does not include checks object in response', () => {
    // Response should only contain { status }
    expect(source).toContain('{ status }');
    expect(source).not.toContain('checks,');
    expect(source).not.toContain('timestamp:');
  });

  it('returns only healthy/degraded status', () => {
    expect(source).toContain("'healthy'");
    expect(source).toContain("'degraded'");
  });
});

describe('getClientIp unit tests', () => {
  // Direct unit test of the function
  // Note: this must be dynamically imported to avoid module-level issues
  it('returns rightmost IP from x-forwarded-for', async () => {
    const { getClientIp } = await import('@/lib/auth/get-ip');
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2, 3.3.3.3' },
    });
    expect(getClientIp(req)).toBe('3.3.3.3');
  });

  it('returns single IP from x-forwarded-for', async () => {
    const { getClientIp } = await import('@/lib/auth/get-ip');
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '10.0.0.1' },
    });
    expect(getClientIp(req)).toBe('10.0.0.1');
  });

  it('falls back to x-real-ip', async () => {
    const { getClientIp } = await import('@/lib/auth/get-ip');
    const req = new Request('http://localhost', {
      headers: { 'x-real-ip': '4.4.4.4' },
    });
    expect(getClientIp(req)).toBe('4.4.4.4');
  });

  it('falls back to 127.0.0.1', async () => {
    const { getClientIp } = await import('@/lib/auth/get-ip');
    const req = new Request('http://localhost');
    expect(getClientIp(req)).toBe('127.0.0.1');
  });
});
