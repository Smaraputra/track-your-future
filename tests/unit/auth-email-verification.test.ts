import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  EMAIL_VERIFICATION_TTL_MS,
  generateVerificationToken,
  hashVerificationToken,
  isVerificationTokenExpired,
  verificationTokenExpiry,
} from '@/lib/auth/email-verification';
import {
  registerSchema,
  resendVerificationSchema,
  verifyEmailSchema,
} from '@/lib/auth/schemas';

describe('email-verification token helpers', () => {
  it('generateVerificationToken returns a high-entropy base64url string', () => {
    const token = generateVerificationToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(40);
  });

  it('generateVerificationToken never repeats across many calls', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      seen.add(generateVerificationToken());
    }
    expect(seen.size).toBe(20);
  });

  it('hashVerificationToken is deterministic 64-char hex', () => {
    const first = hashVerificationToken('abc-def');
    const second = hashVerificationToken('abc-def');
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it('hashVerificationToken produces different output for different inputs', () => {
    expect(hashVerificationToken('a')).not.toBe(hashVerificationToken('b'));
  });

  it('verificationTokenExpiry is 24 hours in the future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const expiry = verificationTokenExpiry(now);
    expect(expiry.getTime() - now.getTime()).toBe(EMAIL_VERIFICATION_TTL_MS);
    expect(EMAIL_VERIFICATION_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('isVerificationTokenExpired distinguishes past and future', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    expect(isVerificationTokenExpired(new Date(now.getTime() + 60_000), now)).toBe(false);
    expect(isVerificationTokenExpired(new Date(now.getTime() - 1), now)).toBe(true);
  });
});

describe('registration / verification schemas', () => {
  const valid = {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    password: 'longenough123',
    acceptTerms: true,
  };

  it('registerSchema accepts valid input', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('registerSchema rejects unaccepted terms', () => {
    expect(registerSchema.safeParse({ ...valid, acceptTerms: false }).success).toBe(false);
  });

  it('registerSchema enforces password length and required name', () => {
    expect(registerSchema.safeParse({ ...valid, password: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('registerSchema rejects invalid email', () => {
    expect(registerSchema.safeParse({ ...valid, email: 'nope' }).success).toBe(false);
  });

  it('resendVerificationSchema requires a valid email', () => {
    expect(resendVerificationSchema.safeParse({ email: 'nope' }).success).toBe(false);
    expect(resendVerificationSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
  });

  it('verifyEmailSchema requires a non-trivial token', () => {
    expect(verifyEmailSchema.safeParse({ token: 'short' }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ token: 'x'.repeat(40) }).success).toBe(true);
  });
});

describe('register route shape', () => {
  const src = readFileSync(
    resolve(__dirname, '../../src/app/api/auth/register/route.ts'),
    'utf-8',
  );

  it('hashes both the password and the verification token before storing', () => {
    expect(src).toContain('hashPassword(parsed.data.password)');
    expect(src).toContain('hashVerificationToken(rawToken)');
  });

  it('returns the same JSON across paths (enumeration resistance)', () => {
    expect(src).toContain('GENERIC_OK');
    const okReturns = src.match(/NextResponse\.json\(GENERIC_OK\)/g);
    expect(okReturns?.length).toBeGreaterThanOrEqual(2);
  });

  it('does not mark new users as verified on creation', () => {
    expect(src).toContain('.values({ name: parsed.data.name, email, hashedPassword: hashed })');
    expect(src).not.toContain('emailVerified: new Date()');
    expect(src).not.toContain('emailVerified: now');
  });

  it('rate-limits by both IP and email hash', () => {
    expect(src).toContain('register:ip:');
    expect(src).toContain('register:email:');
  });

  it('notifies (not creates) when a verified account already exists', () => {
    expect(src).toContain('sendAccountExistsEmail');
  });
});

describe('verify-email route shape', () => {
  const src = readFileSync(
    resolve(__dirname, '../../src/app/api/auth/verify-email/route.ts'),
    'utf-8',
  );

  it('validates expiry and single-use before accepting', () => {
    expect(src).toContain('isVerificationTokenExpired(record.expiresAt)');
    expect(src).toContain('record.usedAt');
  });

  it('sets emailVerified and consumes the token', () => {
    expect(src).toContain('emailVerified: now');
    expect(src).toContain('usedAt: now');
  });

  it('gates the welcome email on the product preference', () => {
    expect(src).toContain('emailPreferences?.product');
    expect(src).toContain('sendWelcomeEmail');
  });
});

describe('resend verification route shape', () => {
  const src = readFileSync(
    resolve(__dirname, '../../src/app/api/auth/verify-email/resend/route.ts'),
    'utf-8',
  );

  it('only reissues for unverified credentials accounts', () => {
    expect(src).toContain('!user.emailVerified');
    expect(src).toContain('user.hashedPassword');
  });

  it('returns generic success (enumeration resistance) and rate-limits', () => {
    expect(src).toContain('GENERIC_OK');
    expect(src).toContain('email-verify-resend:ip:');
    expect(src).toContain('email-verify-resend:email:');
  });
});

describe('auth public paths include register and verify-email', () => {
  const authSrc = readFileSync(resolve(__dirname, '../../src/auth.ts'), 'utf-8');
  it('allows /register and /verify-email without a session', () => {
    expect(authSrc).toContain("'/register'");
    expect(authSrc).toContain("'/verify-email'");
  });
});
