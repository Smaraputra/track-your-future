import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { evaluateOauthLinking } from '@/lib/auth/account-linking-rules';

describe('evaluateOauthLinking', () => {
  it('allows a brand-new OAuth user with no existing record', () => {
    expect(
      evaluateOauthLinking({
        provider: 'google',
        existingUser: null,
        existingAccount: null,
      }),
    ).toEqual({ allowed: true });
  });

  it('allows re-login when the OAuth provider is already linked', () => {
    expect(
      evaluateOauthLinking({
        provider: 'google',
        existingUser: {
          emailVerified: new Date(),
          hashedPassword: null,
        },
        existingAccount: { provider: 'google' },
      }),
    ).toEqual({ allowed: true });
  });

  it('rejects OAuth linking when an unverified credentials account exists', () => {
    const decision = evaluateOauthLinking({
      provider: 'google',
      existingUser: {
        emailVerified: null,
        hashedPassword: '$2b$12$fakehash',
      },
      existingAccount: null,
    });
    expect(decision).toEqual({
      allowed: false,
      reason: 'unverified_credentials',
    });
  });

  it('rejects OAuth linking when a verified account exists but is not linked to this provider', () => {
    const decision = evaluateOauthLinking({
      provider: 'github',
      existingUser: {
        emailVerified: new Date(),
        hashedPassword: '$2b$12$fakehash',
      },
      existingAccount: { provider: 'google' },
    });
    expect(decision).toEqual({
      allowed: false,
      reason: 'existing_account',
    });
  });

  it('rejects when an unverified existing user has no password either (edge case)', () => {
    const decision = evaluateOauthLinking({
      provider: 'google',
      existingUser: {
        emailVerified: null,
        hashedPassword: null,
      },
      existingAccount: null,
    });
    expect(decision).toEqual({
      allowed: false,
      reason: 'unverified_credentials',
    });
  });
});

describe('auth.ts OAuth linking hardening', () => {
  const authSource = readFileSync(
    resolve(__dirname, '../../src/auth.ts'),
    'utf-8',
  );

  it('does not enable allowDangerousEmailAccountLinking', () => {
    expect(authSource).not.toContain('allowDangerousEmailAccountLinking');
  });

  it('wires the signIn callback through isOauthLinkingAllowed', () => {
    expect(authSource).toContain('isOauthLinkingAllowed');
    expect(authSource).toMatch(/async\s+signIn\s*\(/);
  });

  it('short-circuits credentials provider sign-ins', () => {
    expect(authSource).toContain("account.provider === 'credentials'");
  });

  it('surfaces UnverifiedEmail error for takeover attempts', () => {
    expect(authSource).toContain('UnverifiedEmail');
  });
});

describe('login page error map', () => {
  const loginPageSource = readFileSync(
    resolve(__dirname, '../../src/app/(public)/login/page.tsx'),
    'utf-8',
  );

  it('maps UnverifiedEmail to a user-facing message', () => {
    expect(loginPageSource).toContain('UnverifiedEmail');
    expect(loginPageSource).toMatch(/verif[yi]/i);
  });
});
