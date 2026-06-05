import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './auth';

export type ApiTokenScope = 'read' | 'write';

export const apiTokens = pgTable(
  'api_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    // SHA-256 hex of the plaintext token. Deterministic so it can be looked up
    // by value (bcrypt cannot -- it salts randomly). Unique => indexed.
    tokenHash: text('token_hash').notNull().unique(),
    // First chars of the plaintext (e.g. `tyf_a1b2c3d4`) for display only.
    tokenPrefix: text('token_prefix').notNull(),
    scope: text('scope').$type<ApiTokenScope>().notNull().default('read'),
    lastUsedAt: timestamp('last_used_at', { mode: 'date' }),
    expiresAt: timestamp('expires_at', { mode: 'date' }),
    // Soft revoke -- keeps usage history and audit trail intact.
    revokedAt: timestamp('revoked_at', { mode: 'date' }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('api_tokens_user_id_idx').on(t.userId)],
);
