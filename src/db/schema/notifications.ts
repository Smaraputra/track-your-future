import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { notificationTypeEnum } from './enums';
import { users } from './auth';
import { applications } from './applications';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    body: text('body'),
    isRead: boolean('is_read').default(false).notNull(),
    applicationId: uuid('application_id').references(() => applications.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [
    index('notifications_user_id_idx').on(t.userId),
    index('notifications_user_id_is_read_idx').on(t.userId, t.isRead),
  ],
);
