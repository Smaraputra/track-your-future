import { describe, expect, it, vi, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

vi.mock('@/lib/redis', () => ({
  redis: null,
}));

describe('login-lockout primitives (redis unavailable = fail-closed)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('hashEmailForKey normalizes and returns 64-char hex', async () => {
    const mod = await import('@/lib/auth/login-lockout');
    const a = mod.hashEmailForKey('Foo@Example.com');
    const b = mod.hashEmailForKey('  foo@example.com  ');
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it('isEmailLockedOut returns true when redis is unavailable (fail-closed)', async () => {
    const mod = await import('@/lib/auth/login-lockout');
    const locked = await mod.isEmailLockedOut('a'.repeat(64));
    expect(locked).toBe(true);
  });

  it('getLoginFailureCount returns 0 when redis is unavailable', async () => {
    const mod = await import('@/lib/auth/login-lockout');
    const count = await mod.getLoginFailureCount('b'.repeat(64));
    expect(count).toBe(0);
  });

  it('recordLoginFailure returns threshold when redis is unavailable', async () => {
    const mod = await import('@/lib/auth/login-lockout');
    const value = await mod.recordLoginFailure('c'.repeat(64));
    expect(value).toBe(mod.LOGIN_FAILURE_THRESHOLD);
  });

  it('shouldSendLockoutNotification returns false when redis is unavailable', async () => {
    const mod = await import('@/lib/auth/login-lockout');
    const send = await mod.shouldSendLockoutNotification('d'.repeat(64));
    expect(send).toBe(false);
  });

  it('clearLoginFailures does not throw when redis is unavailable', async () => {
    const mod = await import('@/lib/auth/login-lockout');
    await expect(mod.clearLoginFailures('e'.repeat(64))).resolves.toBeUndefined();
  });

  it('exposes a 10-failure threshold over a 60-minute window', async () => {
    const mod = await import('@/lib/auth/login-lockout');
    expect(mod.LOGIN_FAILURE_THRESHOLD).toBe(10);
    expect(mod.LOGIN_FAILURE_WINDOW_SECONDS).toBe(3600);
  });
});

describe('auth.ts login-lockout wiring', () => {
  const authSource = readFileSync(
    resolve(__dirname, '../../src/auth.ts'),
    'utf-8',
  );

  it('checks lockout before running bcrypt', () => {
    const isLockedIdx = authSource.indexOf('isEmailLockedOut(emailHash)');
    const verifyIdx = authSource.indexOf('verifyPassword(');
    expect(isLockedIdx).toBeGreaterThan(-1);
    expect(verifyIdx).toBeGreaterThan(isLockedIdx);
  });

  it('records a login failure when password check fails', () => {
    expect(authSource).toContain('recordLoginFailure(emailHash)');
  });

  it('clears failures on successful login', () => {
    expect(authSource).toContain('clearLoginFailures(emailHash)');
  });

  it('sends a one-shot lockout notification at threshold', () => {
    expect(authSource).toContain('shouldSendLockoutNotification(emailHash)');
    expect(authSource).toContain('sendLoginLockoutEmail');
  });
});

describe('email.ts recipient redaction', () => {
  const emailSource = readFileSync(
    resolve(__dirname, '../../src/lib/email.ts'),
    'utf-8',
  );

  it('does not log raw recipient email in dev', () => {
    expect(emailSource).not.toContain('`To: ${opts.to}`');
    expect(emailSource).toContain('redactRecipient');
  });

  it('exports sendLoginLockoutEmail', () => {
    expect(emailSource).toContain('sendLoginLockoutEmail');
  });
});
