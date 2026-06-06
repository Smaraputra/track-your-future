import { relations } from 'drizzle-orm';

import {
  users,
  accounts,
  sessions,
  passwordResetTokens,
  emailVerificationTokens,
} from './auth';
import { roleCategories, documents, formFieldTemplates } from './core';
import {
  applications,
  applicationStatusHistory,
  applicationDocuments,
} from './applications';
import { subscriptions, payments } from './billing';
import {
  parsedProfiles,
  jobAnalyses,
  matchScores,
  coverLetters,
  interviewPreps,
  resumeSuggestions,
  aiUsage,
} from './ai';
import { notifications } from './notifications';
import { apiTokens } from './api-tokens';

// --- Auth relations ---

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
  apiTokens: many(apiTokens),
  roleCategories: many(roleCategories),
  documents: many(documents),
  applications: many(applications),
  subscriptions: many(subscriptions),
  payments: many(payments),
  parsedProfiles: many(parsedProfiles),
  jobAnalyses: many(jobAnalyses),
  matchScores: many(matchScores),
  coverLetters: many(coverLetters),
  interviewPreps: many(interviewPreps),
  resumeSuggestions: many(resumeSuggestions),
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

export const emailVerificationTokensRelations = relations(
  emailVerificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [emailVerificationTokens.userId],
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
  resumeSuggestions: many(resumeSuggestions),
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
    matchScores: many(matchScores),
    coverLetters: many(coverLetters),
    interviewPreps: many(interviewPreps),
    resumeSuggestions: many(resumeSuggestions),
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

export const matchScoresRelations = relations(matchScores, ({ one }) => ({
  user: one(users, {
    fields: [matchScores.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [matchScores.applicationId],
    references: [applications.id],
  }),
}));

export const coverLettersRelations = relations(coverLetters, ({ one }) => ({
  user: one(users, {
    fields: [coverLetters.userId],
    references: [users.id],
  }),
  application: one(applications, {
    fields: [coverLetters.applicationId],
    references: [applications.id],
  }),
}));

export const interviewPrepsRelations = relations(
  interviewPreps,
  ({ one }) => ({
    user: one(users, {
      fields: [interviewPreps.userId],
      references: [users.id],
    }),
    application: one(applications, {
      fields: [interviewPreps.applicationId],
      references: [applications.id],
    }),
  }),
);

export const resumeSuggestionsRelations = relations(
  resumeSuggestions,
  ({ one }) => ({
    user: one(users, {
      fields: [resumeSuggestions.userId],
      references: [users.id],
    }),
    application: one(applications, {
      fields: [resumeSuggestions.applicationId],
      references: [applications.id],
    }),
    document: one(documents, {
      fields: [resumeSuggestions.documentId],
      references: [documents.id],
    }),
  }),
);

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

// --- API token relations ---

export const apiTokensRelations = relations(apiTokens, ({ one }) => ({
  user: one(users, {
    fields: [apiTokens.userId],
    references: [users.id],
  }),
}));
