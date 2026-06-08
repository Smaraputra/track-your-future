import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(ROOT, p), 'utf-8');

describe('Token management API (session-authenticated)', () => {
  const listCreate = read('src/app/api/settings/api-tokens/route.ts');
  const revoke = read('src/app/api/settings/api-tokens/[tokenId]/route.ts');

  it('GET scopes to the user and excludes revoked tokens', () => {
    expect(listCreate).toContain('export async function GET');
    expect(listCreate).toContain('eq(apiTokens.userId, session.user.id)');
    expect(listCreate).toContain('isNull(apiTokens.revokedAt)');
  });

  it('never selects or returns the token hash to clients', () => {
    // The list/create handlers must not expose tokenHash.
    expect(listCreate).not.toContain('tokenHash: apiTokens.tokenHash');
  });

  it('POST enforces the per-tier token count cap', () => {
    expect(listCreate).toContain("checkResourceLimit(userId, 'apiTokens'");
  });

  it('POST generates a token and returns the plaintext exactly once', () => {
    expect(listCreate).toContain('generateApiToken()');
    expect(listCreate).toContain('{ ...created, token }');
  });

  it('POST writes an audit event', () => {
    expect(listCreate).toContain("action: 'api_token_created'");
  });

  it('POST is rate limited', () => {
    expect(listCreate).toContain('API_TOKEN_MANAGEMENT_LIMIT');
  });

  it('DELETE soft-revokes scoped to the owner and audits it', () => {
    expect(revoke).toContain('export async function DELETE');
    expect(revoke).toContain('revokedAt: new Date()');
    expect(revoke).toContain('eq(apiTokens.userId, session.user.id)');
    expect(revoke).toContain("action: 'api_token_revoked'");
  });
});

describe('v1 token auth wrapper', () => {
  const wrapper = read('src/lib/api/v1/with-token.ts');

  it('rejects missing/invalid tokens with 401', () => {
    expect(wrapper).toContain('authenticateApiToken');
    expect(wrapper).toContain("'unauthorized'");
    expect(wrapper).toContain('401');
    expect(wrapper).toContain("'WWW-Authenticate': 'Bearer'");
  });

  it('enforces write scope with a 403', () => {
    expect(wrapper).toContain("required === 'write'");
    expect(wrapper).toContain('tokenCanWrite');
    expect(wrapper).toContain("'insufficient_scope'");
    expect(wrapper).toContain('403');
  });

  it('rate limits per token owner', () => {
    expect(wrapper).toContain('checkRateLimit(`apiv1:${auth.userId}`');
    expect(wrapper).toContain('API_TOKEN_LIMIT');
    expect(wrapper).toContain('429');
  });
});

describe('v1 resource routes', () => {
  const apps = read('src/app/api/v1/applications/route.ts');
  const appItem = read('src/app/api/v1/applications/[applicationId]/route.ts');
  const confirm = read('src/app/api/v1/documents/confirm/route.ts');
  const templates = read('src/app/api/v1/roles/[roleId]/templates/route.ts');
  const ai = read('src/app/api/v1/ai/[feature]/route.ts');
  const appDocs = read(
    'src/app/api/v1/applications/[applicationId]/documents/route.ts',
  );

  // Tolerate the optional <Ctx> generic on dynamic-route handlers.
  const usesScope = (src: string, scope: string) =>
    new RegExp(`withApiToken(<[^>]+>)?\\('${scope}'`).test(src);

  it('uses read scope for reads and write scope for mutations', () => {
    expect(usesScope(apps, 'read')).toBe(true);
    expect(usesScope(apps, 'write')).toBe(true);
    expect(usesScope(appItem, 'write')).toBe(true);
  });

  it('scopes every application query to the token owner', () => {
    expect(apps).toContain('eq(applications.userId, userId)');
    expect(appItem).toContain('eq(applications.userId, userId)');
  });

  it('confirm rejects file keys that do not belong to the user', () => {
    expect(confirm).toContain('fileKey.startsWith(`${userId}/`)');
    expect(confirm).toContain("'forbidden'");
  });

  it('templates encrypt on write and decrypt on read', () => {
    expect(templates).toContain('encryptField(parsed.data.fieldValue, userId)');
    expect(templates).toContain('safeDecryptField(t.fieldValue, userId)');
  });

  it('AI endpoints are read-only and validate the feature slug', () => {
    expect(usesScope(ai, 'read')).toBe(true);
    expect(ai).toContain('isAiFeatureSlug(feature)');
    expect(usesScope(ai, 'write')).toBe(false);
  });

  it('exposes read GET and write POST/DELETE on application documents', () => {
    expect(usesScope(appDocs, 'read')).toBe(true);
    expect(usesScope(appDocs, 'write')).toBe(true);
    expect(appDocs).toContain('export const GET');
    expect(appDocs).toContain('export const POST');
    expect(appDocs).toContain('export const DELETE');
  });

  it('scopes document linking to the owner and verifies document ownership', () => {
    expect(appDocs).toContain('eq(applications.userId, userId)');
    expect(appDocs).toContain('eq(documents.userId, userId)');
    expect(appDocs).toContain("'already_linked'");
  });

  it('records status history on v1 create and update transitions', () => {
    expect(apps).toContain('applicationStatusHistory');
    expect(apps).toContain("fromStatus: 'draft'");
    expect(appItem).toContain('tx.insert(applicationStatusHistory)');
    expect(appItem).toContain('toStatus: nextStatus');
  });
});
