import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { applicationStatusEnum } from './enums';
import { users } from './auth';
import { roleCategories, documents } from './core';

export const applications = pgTable(
  'applications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleCategoryId: uuid('role_category_id').references(
      () => roleCategories.id,
      { onDelete: 'set null' },
    ),
    companyName: text('company_name').notNull(),
    jobTitle: text('job_title').notNull(),
    jobUrl: text('job_url'),
    currentStatus: applicationStatusEnum('current_status')
      .default('draft')
      .notNull(),
    appliedAt: timestamp('applied_at', { mode: 'date' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index('applications_user_id_idx').on(t.userId),
    index('applications_user_id_current_status_idx').on(
      t.userId,
      t.currentStatus,
    ),
    index('applications_user_id_current_status_updated_at_idx').on(
      t.userId,
      t.currentStatus,
      t.updatedAt,
    ),
  ],
);

export const applicationStatusHistory = pgTable('application_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  applicationId: uuid('application_id')
    .notNull()
    .references(() => applications.id, { onDelete: 'cascade' }),
  fromStatus: applicationStatusEnum('from_status'),
  toStatus: applicationStatusEnum('to_status').notNull(),
  changedAt: timestamp('changed_at', { mode: 'date' }).defaultNow().notNull(),
});

export const applicationDocuments = pgTable(
  'application_documents',
  {
    applicationId: uuid('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.applicationId, t.documentId] })],
);
