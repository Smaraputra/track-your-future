import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const VERSION_PREFIX = 'v1:';

export class FieldEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FieldEncryptionError';
  }
}

let cachedKey: Buffer | null = null;

function loadKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) {
    throw new FieldEncryptionError(
      'DATA_ENCRYPTION_KEY environment variable is not set',
    );
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_BYTES) {
    throw new FieldEncryptionError(
      `DATA_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${key.length})`,
    );
  }
  cachedKey = key;
  return key;
}

export function resetEncryptionKeyCacheForTesting(): void {
  cachedKey = null;
}

export function isEncryptedFieldValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(VERSION_PREFIX);
}

export function encryptField(plaintext: string, aad: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  if (aad) {
    cipher.setAAD(Buffer.from(aad, 'utf8'));
  }
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, encrypted]).toString('base64');
  return `${VERSION_PREFIX}${payload}`;
}

export function decryptField(blob: string, aad: string): string {
  if (!isEncryptedFieldValue(blob)) {
    throw new FieldEncryptionError('Value is not a recognized encrypted blob');
  }
  const key = loadKey();
  const payload = Buffer.from(blob.slice(VERSION_PREFIX.length), 'base64');
  if (payload.length < IV_BYTES + AUTH_TAG_BYTES) {
    throw new FieldEncryptionError('Encrypted payload is too short');
  }
  const iv = payload.subarray(0, IV_BYTES);
  const authTag = payload.subarray(IV_BYTES, IV_BYTES + AUTH_TAG_BYTES);
  const ciphertext = payload.subarray(IV_BYTES + AUTH_TAG_BYTES);

  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_BYTES,
  });
  decipher.setAuthTag(authTag);
  if (aad) {
    decipher.setAAD(Buffer.from(aad, 'utf8'));
  }
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

export function safeDecryptField(
  blob: string | null | undefined,
  aad: string,
): string {
  if (blob == null) return '';
  if (!isEncryptedFieldValue(blob)) {
    return blob;
  }
  return decryptField(blob, aad);
}
