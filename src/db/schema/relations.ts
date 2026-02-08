import { relations } from 'drizzle-orm';

import {
  users,
  accounts,
  sessions,
  passwordResetTokens,
} from './auth';
import { roleCategories, documents, formFieldTemplates } from './core';
import {
  applications,
  applicationStatusHistory,
  applicationDocuments,
} from './applications';
import { subscriptions, payments } from './billing';
import { parsedProfiles, jobAnalyses, aiUsage } from './ai';
import { notifications } from './notifications';

// --- Auth relations ---

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  roleCategories: many(roleCategories),
  documents: many(documents),
  applications: many(applications),
  subscriptions: many(subscriptions),
  payments: many(payments),
  parsedProfiles: many(parsedProfiles),
  jobAnalyses: many(jobAnalyses),
  aiUsage: many(aiUsage),
  notifications: many(notifications),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  }),
);

// --- Core relations ---

export const roleCategoriesRelations = relations(
  roleCategories,
  ({ one, many }) => ({
    user: one(users, {
      fields: [roleCategories.userId],
      references: [users.id],
    }),
    documents: many(documents),
    formFieldTemplates: many(formFieldTemplates),
    applications: many(applications),
  }),
);

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  roleCategory: one(roleCategories, {
    fields: [documents.roleCategoryId],
    references: [roleCategories.id],
  }),
  parsedProfiles: many(parsedProfiles),
  applicationDocuments: many(applicationDocuments),
}));

export const formFieldTemplatesRelations = relations(
  formFieldTemplates,
  ({ one }) => ({
    user: one(users, {
      fields: [formFieldTemplates.userId],
      references: [users.id],
    }),
    roleCategory: one(roleCategories, {
      fields: [formFieldTemplates.roleCategoryId],
      references: [roleCategories.id],
    }),
  }),
);

// --- Application relations ---

export const applicationsRelations = relations(
  applications,
  ({ one, many }) => ({
    user: one(users, {
      fields: [applications.userId],
      references: [users.id],
    }),
    roleCategory: one(roleCategories, {
      fields: [applications.roleCategoryId],
      references: [roleCategories.id],
    }),
    statusHistory: many(applicationStatusHistory),
    applicationDocuments: many(applicationDocuments),
    jobAnalyses: many(jobAnalyses),
    notifications: many(notifications),
  }),
);

export const applicationStatusHistoryRelations = relations(
  applicationStatusHistory,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationStatusHistory.applicationId],
      references: [applications.id],
    }),
  }),
);

export const applicationDocumentsRelations = relations(
  applicationDocuments,
  ({ one }) => ({
    application: one(applications, {
      fields: [applicationDocuments.applicationId],
      references: [applications.id],
    }),
    document: one(documents, {
      fields: [applicationDocuments.documentId],
      references: [documents.id],
    }),
  }),
);

// --- Billing relations ---

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [subscriptions.userId],
      references: [users.id],
    }),
    payments: many(payments),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

// --- AI relations ---

export const parsedProfilesRelations = relations(
  parsedProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [parsedProfiles.userId],
      references: [users.id],
    }),
    document: one(documents, {
      fields: [parsedProfiles.documentId],
      references: [documents.id],
    }),
  }),
);

export const jobAnalysesRelations = relations(jobAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [jobAnalyses.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [jobAnalyses.applicationId],
    references: [applications.id],
  }),
}));

export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  user: one(users, {
    fields: [aiUsage.userId],
    references: [users.id],
  }),
}));

// --- Notification relations ---

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [notifications.applicationId],
    references: [applications.id],
  }),
}));
