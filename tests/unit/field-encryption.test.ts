import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { randomBytes } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import {
  FieldEncryptionError,
  decryptField,
  encryptField,
  isEncryptedFieldValue,
  resetEncryptionKeyCacheForTesting,
  safeDecryptField,
} from '@/lib/crypto/field-encryption';

function setTestKey() {
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  resetEncryptionKeyCacheForTesting();
}

describe('field-encryption round-trip', () => {
  beforeEach(() => {
    setTestKey();
  });
  afterEach(() => {
    delete process.env.DATA_ENCRYPTION_KEY;
    resetEncryptionKeyCacheForTesting();
  });

  it('encrypts and decrypts the same plaintext', () => {
    const plaintext = 'My salary expectation is $120k.';
    const aad = 'user-123';
    const blob = encryptField(plaintext, aad);
    expect(blob).toMatch(/^v1:/);
    expect(decryptField(blob, aad)).toBe(plaintext);
  });

  it('produces a different blob each call (fresh IV)', () => {
    const aad = 'user-123';
    const a = encryptField('same', aad);
    const b = encryptField('same', aad);
    expect(a).not.toBe(b);
  });

  it('isEncryptedFieldValue recognizes the v1: prefix', () => {
    expect(isEncryptedFieldValue('v1:AAAA')).toBe(true);
    expect(isEncryptedFieldValue('plain text')).toBe(false);
    expect(isEncryptedFieldValue(null)).toBe(false);
    expect(isEncryptedFieldValue(undefined)).toBe(false);
  });

  it('decryption fails when the ciphertext is tampered', () => {
    const blob = encryptField('secret', 'user-1');
    const mutated = blob.slice(0, -4) + 'AAAA';
    expect(() => decryptField(mutated, 'user-1')).toThrow();
  });

  it('decryption fails when the AAD (userId) does not match', () => {
    const blob = encryptField('secret', 'user-A');
    expect(() => decryptField(blob, 'user-B')).toThrow();
  });

  it('decryption fails when the payload is too short', () => {
    expect(() => decryptField('v1:' + Buffer.from('short').toString('base64'), 'u')).toThrow(
      FieldEncryptionError,
    );
  });

  it('safeDecryptField passes through plaintext strings (backfill tolerance)', () => {
    expect(safeDecryptField('just a plain string', 'user-1')).toBe('just a plain string');
  });

  it('safeDecryptField treats null/undefined as empty string', () => {
    expect(safeDecryptField(null, 'user-1')).toBe('');
    expect(safeDecryptField(undefined, 'user-1')).toBe('');
  });

  it('safeDecryptField decrypts v1: blobs', () => {
    const blob = encryptField('hello', 'u');
    expect(safeDecryptField(blob, 'u')).toBe('hello');
  });
});

describe('field-encryption key validation', () => {
  afterEach(() => {
    delete process.env.DATA_ENCRYPTION_KEY;
    resetEncryptionKeyCacheForTesting();
  });

  it('throws when the key is missing', () => {
    delete process.env.DATA_ENCRYPTION_KEY;
    resetEncryptionKeyCacheForTesting();
    expect(() => encryptField('x', 'u')).toThrow(/DATA_ENCRYPTION_KEY/);
  });

  it('throws when the key is the wrong length', () => {
    process.env.DATA_ENCRYPTION_KEY = Buffer.from('short').toString('base64');
    resetEncryptionKeyCacheForTesting();
    expect(() => encryptField('x', 'u')).toThrow(/32 bytes/);
  });
});

describe('template routes wire up encryption', () => {
  const listSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/roles/[roleId]/templates/route.ts'),
    'utf-8',
  );
  const detailSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/roles/[roleId]/templates/[templateId]/route.ts'),
    'utf-8',
  );
  const exportSrc = readFileSync(
    resolve(__dirname, '../../src/app/api/settings/export/route.ts'),
    'utf-8',
  );
  const rolePageSrc = readFileSync(
    resolve(__dirname, '../../src/app/(dashboard)/roles/[roleId]/page.tsx'),
    'utf-8',
  );

  it('list route encrypts on create and decrypts on read', () => {
    expect(listSrc).toContain('encryptField(parsed.data.fieldValue, session.user.id)');
    expect(listSrc).toContain('safeDecryptField(t.fieldValue, session.user.id)');
  });

  it('detail route encrypts on PATCH and decrypts on GET/PATCH response', () => {
    expect(detailSrc).toContain('encryptField(parsed.data.fieldValue, session.user.id)');
    expect(detailSrc).toContain('safeDecryptField(template.fieldValue, session.user.id)');
    expect(detailSrc).toContain('safeDecryptField(updated.fieldValue, session.user.id)');
  });

  it('export decrypts fieldValue before writing JSON', () => {
    expect(exportSrc).toContain('safeDecryptField(t.fieldValue, userId)');
    expect(exportSrc).toContain('formFieldTemplates: decryptedFormFieldTemplates');
  });

  it('role detail page decrypts before passing to TemplateList', () => {
    expect(rolePageSrc).toContain('safeDecryptField(t.fieldValue, userId)');
    expect(rolePageSrc).toContain('initialTemplates={decryptedTemplates}');
  });
});
