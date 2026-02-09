import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { aiFeatureEnum } from './enums';
import { users } from './auth';
import { documents } from './core';
import { applications } from './applications';

export const parsedProfiles = pgTable('parsed_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  parsedData: jsonb('parsed_data').notNull(),
  rawText: text('raw_text'),
  confidenceScore: numeric('confidence_score', {
    precision: 3,
    scale: 2,
  }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const jobAnalyses = pgTable(
  'job_analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    applicationId: uuid('application_id').references(() => applications.id, {
      onDelete: 'set null',
    }),
    sourceUrl: text('source_url'),
    rawText: text('raw_text'),
    analysis: jsonb('analysis').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('job_analyses_source_url_idx').on(t.sourceUrl)],
);

export const matchScores = pgTable('match_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => applications.id, {
    onDelete: 'set null',
  }),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
  result: jsonb('result').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const coverLetters = pgTable('cover_letters', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => applications.id, {
    onDelete: 'set null',
  }),
  tone: text('tone').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const interviewPreps = pgTable('interview_preps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => applications.id, {
    onDelete: 'set null',
  }),
  result: jsonb('result').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const resumeSuggestions = pgTable('resume_suggestions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  applicationId: uuid('application_id').references(() => applications.id, {
    onDelete: 'set null',
  }),
  documentId: uuid('document_id').references(() => documents.id, {
    onDelete: 'set null',
  }),
  result: jsonb('result').notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const aiUsage = pgTable(
  'ai_usage',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    feature: aiFeatureEnum('feature').notNull(),
    model: text('model').notNull(),
    inputTokens: integer('input_tokens').notNull(),
    outputTokens: integer('output_tokens').notNull(),
    costCents: numeric('cost_cents', { precision: 10, scale: 4 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (t) => [index('ai_usage_user_id_idx').on(t.userId)],
);
