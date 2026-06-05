import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';

import {
  API_TOKEN_PREFIX,
  generateApiToken,
  hashApiToken,
} from '@/lib/crypto/api-token';

describe('api-token crypto', () => {
  describe('generateApiToken', () => {
    it('produces a token with the tyf_ prefix', () => {
      const { token } = generateApiToken();
      expect(token.startsWith(API_TOKEN_PREFIX)).toBe(true);
    });

    it('returns a sha256 hex digest matching the token', () => {
      const { token, tokenHash } = generateApiToken();
      expect(tokenHash).toHaveLength(64);
      expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(tokenHash).toBe(createHash('sha256').update(token).digest('hex'));
    });

    it('exposes a display prefix that is a prefix of the token', () => {
      const { token, tokenPrefix } = generateApiToken();
      expect(tokenPrefix.startsWith(API_TOKEN_PREFIX)).toBe(true);
      expect(token.startsWith(tokenPrefix)).toBe(true);
      // tyf_ (4) + 8 secret chars
      expect(tokenPrefix).toHaveLength(12);
    });

    it('generates unique, high-entropy tokens', () => {
      const a = generateApiToken();
      const b = generateApiToken();
      expect(a.token).not.toBe(b.token);
      expect(a.tokenHash).not.toBe(b.tokenHash);
      // 32 random bytes -> ~43 base64url chars, plus the prefix
      expect(a.token.length).toBeGreaterThan(40);
    });
  });

  describe('hashApiToken', () => {
    it('is deterministic for the same input', () => {
      expect(hashApiToken('tyf_abc')).toBe(hashApiToken('tyf_abc'));
    });

    it('differs for different inputs', () => {
      expect(hashApiToken('tyf_abc')).not.toBe(hashApiToken('tyf_abd'));
    });
  });
});
