import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  PASSWORD_RESET_TTL_MS,
  generateResetToken,
  hashResetToken,
  isResetTokenExpired,
  resetTokenExpiry,
  tokensMatch,
} from '@/lib/auth/password-reset';
import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from '@/lib/auth/schemas';

describe('password-reset token helpers', () => {
  it('generateResetToken returns a high-entropy base64url string', () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(40);
  });

  it('generateResetToken never repeats across many calls', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      seen.add(generateResetToken());
    }
    expect(seen.size).toBe(20);
  });

  it('hashResetToken is deterministic 64-char hex', () => {
    const token = 'abc-def';
    const first = hashResetToken(token);
    const second = hashResetToken(token);
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashResetToken produces different output for different inputs', () => {
    expect(hashResetToken('a')).not.toBe(hashResetToken('b'));
  });

  it('tokensMatch is true for identical hex strings', () => {
    const h = hashResetToken('same');
    expect(tokensMatch(h, h)).toBe(true);
  });

  it('tokensMatch is false for different hex strings of same length', () => {
    expect(tokensMatch(hashResetToken('a'), hashResetToken('b'))).toBe(false);
  });

  it('tokensMatch is false for different-length inputs (no throw)', () => {
    expect(tokensMatch('abcd', 'abcdef')).toBe(false);
  });

  it('resetTokenExpiry is one hour in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const expiry = resetTokenExpiry(now);
    expect(expiry.getTime() - now.getTime()).toBe(PASSWORD_RESET_TTL_MS);
  });

  it('isResetTokenExpired returns false for future expiries', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const future = new Date(now.getTime() + 60_000);
    expect(isResetTokenExpired(future, now)).toBe(false);
  });

  it('isResetTokenExpired returns true for past expiries', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const past = new Date(now.getTime() - 1);
    expect(isResetTokenExpired(past, now)).toBe(true);
  });
});

describe('password-reset schemas', () => {
  it('passwordResetRequestSchema requires valid email', () => {
    expect(passwordResetRequestSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(passwordResetRequestSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
  });

  it('passwordResetConfirmSchema enforces password length', () => {
    expect(
      passwordResetConfirmSchema.safeParse({
        token: 'x'.repeat(40),
        newPassword: 'short',
      }).success,
    ).toBe(false);
    expect(
      passwordResetConfirmSchema.safeParse({
        token: 'x'.repeat(40),
        newPassword: 'longenough123',
      }).success,
    ).toBe(true);
  });

  it('passwordResetConfirmSchema requires non-trivial token length', () => {
    expect(
      passwordResetConfirmSchema.safeParse({
        token: 'short',
        newPassword: 'longenough123',
      }).success,
    ).toBe(false);
  });
});

describe('password-reset route shape', () => {
  const requestSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/auth/password-reset/request/route.ts'),
    'utf-8',
  );
  const confirmSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/auth/password-reset/confirm/route.ts'),
    'utf-8',
  );

  it('request route hashes the token before storing', () => {
    expect(requestSrc).toContain('hashResetToken(rawToken)');
    expect(requestSrc).toContain('values({');
    expect(requestSrc).toContain('token: tokenHash');
  });

  it('request route returns the same JSON on hit and miss (enumeration resistance)', () => {
    expect(requestSrc).toContain('GENERIC_OK');
    const okReturns = requestSrc.match(/NextResponse\.json\(GENERIC_OK\)/g);
    expect(okReturns?.length).toBeGreaterThanOrEqual(2);
  });

  it('request route rate-limits by both IP and email hash', () => {
    expect(requestSrc).toContain('pw-reset-request:ip:');
    expect(requestSrc).toContain('pw-reset-request:email:');
  });

  it('confirm route validates, checks expiry, marks usedAt, and invalidates sessions', () => {
    expect(confirmSrc).toContain('isResetTokenExpired(record.expiresAt)');
    expect(confirmSrc).toContain('record.usedAt');
    expect(confirmSrc).toContain('usedAt: now');
    expect(confirmSrc).toContain('passwordChangedAt: now');
    expect(confirmSrc).toContain('invalidateUserSessions(record.userId)');
    expect(confirmSrc).toContain('delete(sessions)');
  });
});

describe('jwt callback invalidation wiring', () => {
  const authSrc = readFileSync(
    resolve(__dirname, '../../src/auth.ts'),
    'utf-8',
  );

  it('stamps signedInAt on initial sign-in', () => {
    expect(authSrc).toContain('token.signedInAt = Math.floor(Date.now() / 1000)');
  });

  it('rejects tokens invalidated by a password change', () => {
    expect(authSrc).toContain('isSessionStillValid(token.id, token.signedInAt)');
  });

  it('allows forgot-password and reset-password as public paths', () => {
    expect(authSrc).toContain("'/forgot-password'");
    expect(authSrc).toContain("'/reset-password'");
  });
});

describe('change-password route invalidates sessions', () => {
  const src = readFileSync(
    resolve(__dirname, '../../src/app/api/settings/change-password/route.ts'),
    'utf-8',
  );
  it('calls invalidateUserSessions after update', () => {
    expect(src).toContain('invalidateUserSessions(session.user.id)');
    expect(src).toContain('passwordChangedAt: new Date()');
  });
});
