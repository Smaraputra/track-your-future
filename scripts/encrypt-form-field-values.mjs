#!/usr/bin/env node
// Backfill script: encrypts any plaintext form_field_templates.field_value
// rows with AES-256-GCM, using DATA_ENCRYPTION_KEY and per-row userId as AAD.
// Safe to re-run -- rows already prefixed with "v1:" are skipped.
//
// Usage:
//   DATABASE_URL=... DATA_ENCRYPTION_KEY=<base64> node scripts/encrypt-form-field-values.mjs
//
// Add --dry-run to preview without writing.

import { createCipheriv, randomBytes } from 'node:crypto';
import postgres from 'postgres';

const VERSION_PREFIX = 'v1:';
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;

function loadKey() {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error('DATA_ENCRYPTION_KEY environment variable is not set');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error(`DATA_ENCRYPTION_KEY must decode to 32 bytes (got ${key.length})`);
  }
  return key;
}

function encryptField(plaintext, aad, key) {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_BYTES });
  if (aad) cipher.setAAD(Buffer.from(aad, 'utf8'));
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, encrypted]).toString('base64');
  return `${VERSION_PREFIX}${payload}`;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const key = loadKey();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const sql = postgres(dbUrl, { max: 1 });

  const rows = await sql`
    SELECT id, user_id, field_value
    FROM form_field_templates
    WHERE field_value NOT LIKE ${VERSION_PREFIX + '%'}
  `;

  console.log(`Found ${rows.length} plaintext row(s) to encrypt.`);
  if (rows.length === 0) {
    await sql.end();
    return;
  }

  let encrypted = 0;
  for (const row of rows) {
    const blob = encryptField(row.field_value, row.user_id, key);
    if (!dryRun) {
      await sql`
        UPDATE form_field_templates
        SET field_value = ${blob}
        WHERE id = ${row.id} AND field_value = ${row.field_value}
      `;
    }
    encrypted += 1;
  }

  console.log(`${dryRun ? 'Would encrypt' : 'Encrypted'} ${encrypted} row(s).`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
