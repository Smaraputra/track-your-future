import { createHash, randomBytes } from 'crypto';

/**
 * API token generation and hashing.
 *
 * Tokens are high-entropy random secrets, so they are stored as a plain
 * SHA-256 digest -- deterministic, allowing O(1) lookup by hash. bcrypt
 * (used for passwords) cannot be used here because its random salt makes the
 * hash impossible to look up by value. The 256-bit random secret already
 * provides the entropy a password KDF would otherwise add.
 */

export const API_TOKEN_PREFIX = 'tyf_';
const TOKEN_BYTES = 32;
/** Length of the public, displayable prefix (`tyf_` + 8 secret chars). */
const DISPLAY_PREFIX_LENGTH = API_TOKEN_PREFIX.length + 8;

export interface GeneratedApiToken {
  /** Full plaintext token. Shown to the user exactly once, never persisted. */
  token: string;
  /** SHA-256 hex digest of the token. Stored and indexed. */
  tokenHash: string;
  /** Public display prefix, e.g. `tyf_a1b2c3d4`. Safe to persist and show. */
  tokenPrefix: string;
}

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateApiToken(): GeneratedApiToken {
  const secret = randomBytes(TOKEN_BYTES).toString('base64url');
  const token = `${API_TOKEN_PREFIX}${secret}`;
  return {
    token,
    tokenHash: hashApiToken(token),
    tokenPrefix: token.slice(0, DISPLAY_PREFIX_LENGTH),
  };
}
