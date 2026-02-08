# Phase 2: Database Schema

All tables defined via Drizzle ORM schema files in `src/db/schema/`.

## Auth Tables

**users** -- NextAuth v5 managed via `@auth/drizzle-adapter`
- id (uuid, PK), email, name, emailVerified, image, hashedPassword (nullable), createdAt, updatedAt

**accounts, sessions, verification_tokens** -- NextAuth adapter tables (standard schema)

**password_reset_tokens**
- id, userId (FK), token (hashed), expiresAt, usedAt

## Core Tables

**role_categories** -- User-created job role groupings
- id (uuid, PK), userId (FK), name, description, color (hex), position (int), createdAt, updatedAt
- Unique: (userId, name). Index: userId

**documents** -- File metadata (files stored in MinIO)
- id (uuid, PK), userId (FK), roleCategoryId (FK), documentType (enum: cv/cover_letter/summary/custom), customTypeName, fileName, fileKey (MinIO key), mimeType, fileSizeBytes, version (int), isLatest (bool), createdAt
- Unique: fileKey. Indexes: userId, roleCategoryId

**form_field_templates** -- Reusable key-value answers per role
- id (uuid, PK), userId (FK), roleCategoryId (FK), fieldKey, fieldValue, position (int), createdAt, updatedAt
- Unique: (roleCategoryId, fieldKey)

**applications** -- Job application tracker
- id (uuid, PK), userId (FK), roleCategoryId (FK, nullable, SET NULL), companyName, jobTitle, jobUrl, currentStatus (enum: draft/applied/phone_screen/interview/offer/rejected/ghosted/withdrawn), appliedAt, notes, createdAt, updatedAt
- Indexes: userId, (userId, currentStatus), (userId, currentStatus, updatedAt)

**application_status_history** -- Audit trail
- id (uuid, PK), applicationId (FK), fromStatus (nullable), toStatus, changedAt

**application_documents** -- Junction table
- applicationId (FK), documentId (FK) -- composite PK

## Billing Tables

**subscriptions** -- Stripe subscription state
- id (uuid, PK), userId (FK, UNIQUE), provider (default 'stripe'), providerCustomerId, providerSubscriptionId (UNIQUE), providerPriceId, tier (enum: free/pro), status (enum: active/trialing/past_due/canceled/unpaid/incomplete/paused), currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, canceledAt, trialStart, trialEnd, createdAt, updatedAt

**webhook_events** -- Idempotency log
- id (uuid, PK), provider, eventId, eventType, payload (JSONB), processedAt
- Unique: (provider, eventId)

**payments** -- Payment history
- id (uuid, PK), userId (FK), subscriptionId (FK), providerPaymentId, amountCents, currency, status, providerInvoiceUrl, createdAt

## AI Tables

**parsed_profiles** -- Structured data from CV parsing
- id (uuid, PK), userId (FK), documentId (FK), parsedData (JSONB), rawText, confidenceScore, createdAt

**job_analyses** -- AI job description analysis
- id (uuid, PK), userId (FK), applicationId (FK, nullable), sourceUrl, rawText, analysis (JSONB), createdAt
- Index on sourceUrl hash for cross-user caching

**ai_usage** -- Per-call AI cost tracking
- id (uuid, PK), userId (FK), feature (enum: parse/match/cover_letter/interview_prep/resume_suggestions), model, inputTokens, outputTokens, costCents (numeric), createdAt

## Notification Tables

**notifications** -- In-app notification queue
- id (uuid, PK), userId (FK), type (enum: stale_app/follow_up/weekly_summary/milestone), title, body, isRead, applicationId (FK, nullable), createdAt

## Schema File Organization

```
src/db/schema/
  index.ts           -- re-exports all schemas
  auth.ts            -- users, accounts, sessions, verification_tokens, password_reset_tokens
  core.ts            -- role_categories, documents, form_field_templates
  applications.ts    -- applications, application_status_history, application_documents
  billing.ts         -- subscriptions, webhook_events, payments
  ai.ts              -- parsed_profiles, job_analyses, ai_usage
  notifications.ts   -- notifications
  enums.ts           -- shared pgEnum definitions
```

## Status

- [ ] Schema files created
- [ ] Enums defined
- [ ] Relations defined
- [ ] Migration generated and tested
