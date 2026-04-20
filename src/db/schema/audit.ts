import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './auth';

export type AuditAction =
  | 'login_success'
  | 'login_failure'
  | 'login_locked'
  | 'password_changed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'oauth_linked'
  | 'oauth_rejected'
  | 'account_deleted'
  | 'data_exported';

export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index('audit_log_user_id_idx').on(t.userId),
    index('audit_log_action_idx').on(t.action),
    index('audit_log_created_at_idx').on(t.createdAt),
  ],
);
