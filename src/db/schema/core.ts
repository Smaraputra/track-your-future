import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { documentTypeEnum } from './enums';
import { users } from './auth';

export const roleCategories = pgTable(
  'role_categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    color: text('color'),
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique('role_categories_user_id_name_unq').on(t.userId, t.name),
    index('role_categories_user_id_idx').on(t.userId),
  ],
);

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleCategoryId: uuid('role_category_id').references(
      () => roleCategories.id,
      { onDelete: 'set null' },
    ),
    documentType: documentTypeEnum('document_type').notNull(),
    customTypeName: text('custom_type_name'),
    fileName: text('file_name').notNull(),
    fileKey: text('file_key').unique().notNull(),
    mimeType: text('mime_type').notNull(),
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
    version: integer('version').default(1).notNull(),
    isLatest: boolean('is_latest').default(true).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index('documents_user_id_idx').on(t.userId),
    index('documents_role_category_id_idx').on(t.roleCategoryId),
  ],
);

export const formFieldTemplates = pgTable(
  'form_field_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleCategoryId: uuid('role_category_id')
      .notNull()
      .references(() => roleCategories.id, { onDelete: 'cascade' }),
    fieldKey: text('field_key').notNull(),
    fieldValue: text('field_value').notNull(),
    position: integer('position').default(0).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique('form_field_templates_role_category_id_field_key_unq').on(
      t.roleCategoryId,
      t.fieldKey,
    ),
  ],
);
