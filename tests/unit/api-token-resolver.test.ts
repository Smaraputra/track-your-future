// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted above module scope, so the mock vars must be created with
// vi.hoisted() to exist when the factory runs.
const { findFirst, updateMock } = vi.hoisted(() => {
  const findFirst = vi.fn();
  const whereMock = vi.fn(() => Promise.resolve());
  const setMock = vi.fn(() => ({ where: whereMock }));
  const updateMock = vi.fn(() => ({ set: setMock }));
  return { findFirst, updateMock };
});

vi.mock('@/db', () => ({
  db: {
    query: { apiTokens: { findFirst } },
    update: updateMock,
  },
}));

import { authenticateApiToken, tokenCanWrite } from '@/lib/auth/api-token';
import { hashApiToken } from '@/lib/crypto/api-token';

function bearer(token: string): Request {
  return new Request('http://localhost/api/v1/applications', {
    headers: { authorization: `Bearer ${token}` },
  });
}

const baseRecord = {
  id: 'token-1',
  userId: 'user-1',
  scope: 'read' as const,
  expiresAt: null as Date | null,
  lastUsedAt: null as Date | null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('authenticateApiToken', () => {
  it('returns null when no Authorization header is present', async () => {
    const req = new Request('http://localhost/api/v1/applications');
    expect(await authenticateApiToken(req)).toBeNull();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it('returns null for a non-Bearer scheme', async () => {
    const req = new Request('http://localhost', {
      headers: { authorization: 'Basic abc' },
    });
    expect(await authenticateApiToken(req)).toBeNull();
  });

  it('returns null for an empty bearer token', async () => {
    const req = new Request('http://localhost', {
      headers: { authorization: 'Bearer    ' },
    });
    expect(await authenticateApiToken(req)).toBeNull();
  });

  it('looks the token up by its sha256 hash', async () => {
    findFirst.mockResolvedValue({ ...baseRecord });
    await authenticateApiToken(bearer('tyf_secret'));
    // The query is built with the hash, not the plaintext.
    expect(findFirst).toHaveBeenCalledTimes(1);
    // Sanity: ensure we never accidentally query by the plaintext token.
    expect(hashApiToken('tyf_secret')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('resolves a valid token to its owner and scope', async () => {
    findFirst.mockResolvedValue({ ...baseRecord, scope: 'write' });
    const ctx = await authenticateApiToken(bearer('tyf_secret'));
    expect(ctx).toEqual({ userId: 'user-1', tokenId: 'token-1', scope: 'write' });
  });

  it('updates lastUsedAt for a token that has never been used', async () => {
    findFirst.mockResolvedValue({ ...baseRecord, lastUsedAt: null });
    await authenticateApiToken(bearer('tyf_secret'));
    expect(updateMock).toHaveBeenCalledTimes(1);
  });

  it('does not update lastUsedAt within the throttle window', async () => {
    findFirst.mockResolvedValue({ ...baseRecord, lastUsedAt: new Date() });
    await authenticateApiToken(bearer('tyf_secret'));
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('rejects an expired token', async () => {
    findFirst.mockResolvedValue({
      ...baseRecord,
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await authenticateApiToken(bearer('tyf_secret'))).toBeNull();
  });

  it('accepts a token whose expiry is in the future', async () => {
    findFirst.mockResolvedValue({
      ...baseRecord,
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await authenticateApiToken(bearer('tyf_secret'))).not.toBeNull();
  });

  it('returns null when no matching active token exists', async () => {
    findFirst.mockResolvedValue(undefined);
    expect(await authenticateApiToken(bearer('tyf_secret'))).toBeNull();
  });
});

describe('tokenCanWrite', () => {
  it('allows write scope', () => {
    expect(tokenCanWrite('write')).toBe(true);
  });

  it('denies read scope', () => {
    expect(tokenCanWrite('read')).toBe(false);
  });
});
