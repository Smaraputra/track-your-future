import { pgEnum } from 'drizzle-orm/pg-core';

export const documentTypeEnum = pgEnum('document_type', [
  'cv',
  'cover_letter',
  'summary',
  'custom',
]);

export const applicationStatusEnum = pgEnum('application_status', [
  'draft',
  'applied',
  'phone_screen',
  'interview',
  'offer',
  'rejected',
  'ghosted',
  'withdrawn',
]);

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'pro',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'paused',
]);

export const aiFeatureEnum = pgEnum('ai_feature', [
  'parse',
  'match',
  'cover_letter',
  'interview_prep',
  'resume_suggestions',
]);

export const notificationTypeEnum = pgEnum('notification_type', [
  'stale_app',
  'follow_up',
  'weekly_summary',
  'milestone',
]);
