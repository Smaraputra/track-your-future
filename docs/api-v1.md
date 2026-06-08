# Track Your Future API (v1)

## Overview

The Track Your Future API provides programmatic, read and write access to a single user's own job-search data: applications, role categories, reusable form-field answers, documents, notifications, AI-generated outputs, and profile settings. Authentication is performed with personal API tokens. Every request is strictly scoped to the data owned by the token's user; a token can never read or modify another account's data.

The API is versioned. The current version is `v1`, served under the `/api/v1` path prefix. Breaking changes will be introduced under a new version prefix rather than modifying `v1` responses.

## Base URL

| |
|---|
| `https://trackedyourfuture.com/api/v1` |

All paths in this document are relative to that base URL. If you self-host, replace the host with your own domain.

## Authentication

The API uses bearer tokens. Each request must include an `Authorization` header containing a valid, non-expired, non-revoked token.

| |
|---|
| `Authorization: Bearer tyf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |

Tokens have the prefix `tyf_` followed by a high-entropy random secret.

### Creating a token

Tokens are created and revoked from the web application, in `Settings > Developers`. Token management is not available through the API itself; a token cannot be used to create or revoke other tokens.

When creating a token you choose:

| Field | Description |
|-------|-------------|
| Name | A label to help you identify the token later (for example, `CLI` or `Zapier`). |
| Scope | `read` or `read & write`. See [Scopes](#scopes). |
| Expiry | Optional. `No expiry`, or 7, 30, 90, or 365 days. |

The plaintext token is shown exactly once, immediately after creation. It is stored only as a SHA-256 hash and cannot be recovered. If you lose it, revoke the token and create a new one.

### Using a token

| |
|---|
| `curl https://trackedyourfuture.com/api/v1/me \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN"` |

Requests with a missing, malformed, unknown, revoked, or expired token receive `401 Unauthorized` with a `WWW-Authenticate: Bearer` header.

## Scopes

Each token carries a single scope. Write implies read.

| Scope | Permitted methods | Description |
|-------|-------------------|-------------|
| `read` | `GET` | Read-only access to all resources. |
| `write` | `GET`, `POST`, `PATCH`, `DELETE` | Full read and write access. |

A write request made with a read-only token is rejected with `403 Forbidden` and the error code `insufficient_scope`.

## Rate limiting

Requests are limited to 120 per minute, counted per token owner (shared across all of that user's tokens). When the limit is exceeded the API returns `429 Too Many Requests` with a `Retry-After` header indicating the number of seconds to wait.

| |
|---|
| `HTTP/1.1 429 Too Many Requests`<br>`Retry-After: 42`<br>``<br>`{ "error": { "code": "rate_limited", "message": "Rate limit exceeded. Slow down." } }` |

## Response format

Successful responses return the requested resource (an object) or a collection (an array) directly as JSON. Mutations that do not return a resource return a small confirmation object, for example `{ "success": true }`.

Errors return a consistent envelope:

| |
|---|
| `{`<br>`  "error": {`<br>`    "code": "validation_failed",`<br>`    "message": "Validation failed",`<br>`    "details": { }`<br>`  }`<br>`}` |

The `details` field is optional and is present for validation errors (a flattened list of field issues) and for limit errors (the applicable limit and current count).

### Error codes

| HTTP status | `code` | Meaning |
|-------------|--------|---------|
| 400 | `invalid_json` | The request body was not valid JSON. |
| 400 | `validation_failed` | The body failed schema validation. See `details`. |
| 400 | `invalid_filter` | A query-string filter value was not recognized. |
| 400 | `no_fields` | A `PATCH` request contained no updatable fields. |
| 401 | `unauthorized` | Missing, malformed, unknown, revoked, or expired token. |
| 403 | `insufficient_scope` | The token is read-only but the operation requires write. |
| 403 | `forbidden` | The operation targets a resource the caller may not act on. |
| 403 | `limit_reached` | A plan resource or storage limit was reached. See `details`. |
| 404 | `not_found` | The resource does not exist or is not owned by the caller. |
| 409 | `conflict` | A uniqueness constraint was violated (for example a duplicate name). |
| 429 | `rate_limited` | The per-owner rate limit was exceeded. |

## Plan limits

Write operations that create resources are subject to the user's plan limits. Reaching a limit returns `403` with `limit_reached` and a `details` object of the form `{ "limit": number, "current": number }`.

| Resource | Free | Pro |
|----------|------|-----|
| Applications | 25 | Unlimited |
| Documents | 10 | Unlimited |
| Role categories | 3 | Unlimited |
| Form-field templates | 20 | Unlimited |
| Storage | 50 MB | 200 MB |

## Endpoints

### Account

#### GET /me

Returns the authenticated user and the active token's scope. Scope: `read`.

| |
|---|
| `curl https://trackedyourfuture.com/api/v1/me \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN"` |

| |
|---|
| `{`<br>`  "id": "0c0a...",`<br>`  "name": "Jane Doe",`<br>`  "email": "jane@example.com",`<br>`  "image": null,`<br>`  "onboardingCompleted": true,`<br>`  "createdAt": "2026-01-04T10:00:00.000Z",`<br>`  "tier": "pro",`<br>`  "tokenScope": "write"`<br>`}` |

### Applications

#### GET /applications

Lists the caller's applications, most recently updated first. Scope: `read`.

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | enum | Optional. One of `draft`, `applied`, `phone_screen`, `interview`, `offer`, `rejected`, `ghosted`, `withdrawn`. |
| `roleId` | uuid | Optional. Filter by role category. |

| |
|---|
| `curl "https://trackedyourfuture.com/api/v1/applications?status=interview" \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN"` |

#### POST /applications

Creates an application. Scope: `write`. Returns `201` with the created application.

Request body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `companyName` | string | Yes | 1 to 200 characters. |
| `jobTitle` | string | Yes | 1 to 200 characters. |
| `jobUrl` | string | No | Valid URL, up to 2000 characters. |
| `roleCategoryId` | uuid | No | Must be a role category owned by the caller. |
| `notes` | string | No | Up to 20000 characters. |
| `currentStatus` | enum | No | Defaults to `draft`. |
| `appliedAt` | string | No | ISO 8601 date-time with offset. |

| |
|---|
| `curl -X POST https://trackedyourfuture.com/api/v1/applications \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN" \`<br>`  -H "Content-Type: application/json" \`<br>`  -d '{ "companyName": "Acme", "jobTitle": "Engineer", "currentStatus": "applied" }'` |

#### GET /applications/{applicationId}

Returns one application, including its `statusHistory` and `linkedDocuments`. Scope: `read`.

| |
|---|
| `{`<br>`  "id": "1f2e...",`<br>`  "companyName": "Acme",`<br>`  "jobTitle": "Engineer",`<br>`  "currentStatus": "applied",`<br>`  "appliedAt": "2026-06-01T09:00:00.000Z",`<br>`  "statusHistory": [ ],`<br>`  "linkedDocuments": [ ]`<br>`}` |

#### PATCH /applications/{applicationId}

Updates one or more fields of an application. Scope: `write`. The body accepts any subset of the `POST /applications` fields.

#### DELETE /applications/{applicationId}

Deletes an application. Scope: `write`. Returns `{ "success": true }`.

#### PATCH /applications/{applicationId}/status

Changes the status and appends a status-history entry. Scope: `write`. Setting the status to its current value is a no-op. The first transition out of `draft` sets `appliedAt` automatically.

Request body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | enum | Yes | One of the application status values. |

| |
|---|
| `curl -X PATCH https://trackedyourfuture.com/api/v1/applications/1f2e.../status \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN" \`<br>`  -H "Content-Type: application/json" \`<br>`  -d '{ "status": "interview" }'` |

#### GET /applications/{applicationId}/documents

Lists the documents linked to an application. Scope: `read`. Returns an array of document metadata.

#### POST /applications/{applicationId}/documents

Links an existing document to the application. Scope: `write`. Returns `201`. A document already linked to the application returns `409`.

Request body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `documentId` | uuid | Yes | Must be a document owned by the caller. |

| |
|---|
| `curl -X POST https://trackedyourfuture.com/api/v1/applications/1f2e.../documents \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN" \`<br>`  -H "Content-Type: application/json" \`<br>`  -d '{ "documentId": "c3d4..." }'` |

#### DELETE /applications/{applicationId}/documents

Unlinks a document from the application. Scope: `write`. The `documentId` is supplied as a query parameter. Returns `{ "success": true }`.

| |
|---|
| `curl -X DELETE "https://trackedyourfuture.com/api/v1/applications/1f2e.../documents?documentId=c3d4..." \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN"` |

### Role categories

#### GET /roles

Lists role categories, ordered by position. Scope: `read`.

#### POST /roles

Creates a role category. Scope: `write`. Returns `201`. A duplicate name returns `409`.

Request body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | 1 to 100 characters, unique per user. |
| `description` | string | No | Up to 500 characters. |
| `color` | string | No | Hex color, for example `#22c55e`. |

| |
|---|
| `curl -X POST https://trackedyourfuture.com/api/v1/roles \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN" \`<br>`  -H "Content-Type: application/json" \`<br>`  -d '{ "name": "Frontend", "color": "#22c55e" }'` |

#### GET /roles/{roleId}

Returns one role category with related counts. Scope: `read`.

| |
|---|
| `{`<br>`  "id": "9a8b...",`<br>`  "name": "Frontend",`<br>`  "color": "#22c55e",`<br>`  "_counts": { "documents": 2, "applications": 5, "formFieldTemplates": 4 }`<br>`}` |

#### PATCH /roles/{roleId}

Updates a role category. Scope: `write`. Accepts any subset of the create fields.

#### DELETE /roles/{roleId}

Deletes a role category. Scope: `write`. Returns `{ "success": true }`. Associated applications and documents are retained (their role reference is cleared); form-field templates of the role are removed.

### Form-field templates

Reusable answers attached to a role category. Values are encrypted at rest and returned decrypted.

#### GET /roles/{roleId}/templates

Lists the role's templates, ordered by position. Scope: `read`.

#### POST /roles/{roleId}/templates

Creates a template. Scope: `write`. Returns `201`. A duplicate `fieldKey` within the role returns `409`.

Request body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `fieldKey` | string | Yes | 1 to 200 characters, unique within the role. |
| `fieldValue` | string | Yes | 1 to 2000 characters. |

| |
|---|
| `curl -X POST https://trackedyourfuture.com/api/v1/roles/9a8b.../templates \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN" \`<br>`  -H "Content-Type: application/json" \`<br>`  -d '{ "fieldKey": "Why this company?", "fieldValue": "..." }'` |

#### GET /roles/{roleId}/templates/{templateId}

Returns one template. Scope: `read`.

#### PATCH /roles/{roleId}/templates/{templateId}

Updates a template. Scope: `write`. Accepts any subset of `fieldKey` and `fieldValue`.

#### DELETE /roles/{roleId}/templates/{templateId}

Deletes a template. Scope: `write`. Returns `{ "success": true }`.

### Documents

Document binaries are stored in object storage and accessed through time-limited presigned URLs. The API never proxies file bytes.

#### GET /documents

Lists the caller's latest document versions. Scope: `read`.

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | enum | Optional. One of `cv`, `cover_letter`, `summary`, `custom`. |
| `roleId` | uuid | Optional. Filter by role category. |

#### GET /documents/{documentId}

Returns one document's metadata. Scope: `read`.

#### DELETE /documents/{documentId}

Deletes a document from storage and the database. Scope: `write`. If the deleted document was the latest version, the previous version is promoted. Returns `{ "success": true }`.

#### GET /documents/{documentId}/download

Returns a time-limited presigned download URL. Scope: `read`.

| |
|---|
| `{`<br>`  "url": "https://minio.trackedyourfuture.com/...",`<br>`  "fileName": "resume.pdf",`<br>`  "expiresInSeconds": 3600`<br>`}` |

#### Upload flow

Uploading a document is a three-step process. The bytes are sent directly to object storage, not to the API.

Step 1. Request a presigned upload URL. Scope: `write`.

Request body for `POST /documents/presign`:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `fileName` | string | Yes | Original file name. |
| `mimeType` | enum | Yes | `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. |
| `fileSizeBytes` | number | Yes | Positive integer, up to 10 MB. |
| `documentType` | enum | Yes | `cv`, `cover_letter`, `summary`, or `custom`. |
| `customTypeName` | string | Conditional | Required when `documentType` is `custom`. |
| `roleCategoryId` | uuid | No | Must be owned by the caller. |
| `previousDocumentId` | uuid | No | Provide to upload a new version of an existing document. |

| |
|---|
| `curl -X POST https://trackedyourfuture.com/api/v1/documents/presign \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN" \`<br>`  -H "Content-Type: application/json" \`<br>`  -d '{ "fileName": "resume.pdf", "mimeType": "application/pdf", "fileSizeBytes": 84211, "documentType": "cv" }'` |

The response contains the values needed for the next two steps:

| |
|---|
| `{`<br>`  "documentId": "c3d4...",`<br>`  "fileKey": "USER_ID/ROLE/cv/c3d4.../v1/resume.pdf",`<br>`  "uploadUrl": "https://minio.trackedyourfuture.com/...",`<br>`  "version": 1,`<br>`  "fileName": "resume.pdf",`<br>`  "mimeType": "application/pdf",`<br>`  "fileSizeBytes": 84211,`<br>`  "documentType": "cv"`<br>`}` |

Step 2. Upload the file bytes with an HTTP `PUT` to the returned `uploadUrl`. Use the same `Content-Type`. This request goes to object storage and does not include the API token.

| |
|---|
| `curl -X PUT "$UPLOAD_URL" \`<br>`  -H "Content-Type: application/pdf" \`<br>`  --data-binary @resume.pdf` |

Step 3. Confirm the upload to create the database record. Scope: `write`. Pass the values returned by the presign step. The `fileKey` must belong to the calling user. Returns `201` with the created document.

| |
|---|
| `curl -X POST https://trackedyourfuture.com/api/v1/documents/confirm \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN" \`<br>`  -H "Content-Type: application/json" \`<br>`  -d '{ "documentId": "c3d4...", "fileKey": "USER_ID/ROLE/cv/c3d4.../v1/resume.pdf", "fileName": "resume.pdf", "mimeType": "application/pdf", "fileSizeBytes": 84211, "documentType": "cv", "version": 1 }'` |

### Notifications

#### GET /notifications

Lists up to 50 of the caller's notifications, most recent first. Scope: `read`.

Query parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `unread` | boolean | Optional. Set to `true` to return only unread notifications. |

#### PATCH /notifications/{notificationId}

Marks a notification as read or unread. Scope: `write`. Returns the updated notification.

Request body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `isRead` | boolean | Yes | Target read state. |

| |
|---|
| `curl -X PATCH https://trackedyourfuture.com/api/v1/notifications/77ab... \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN" \`<br>`  -H "Content-Type: application/json" \`<br>`  -d '{ "isRead": true }'` |

### AI outputs

Read-only access to previously generated AI results. These endpoints do not trigger new AI generation. Scope: `read`.

#### GET /ai/{feature}

Lists up to 100 of the caller's items for the given feature, most recent first.

| `feature` slug | Content |
|----------------|---------|
| `cover-letters` | Generated cover letters. |
| `match-scores` | Resume-to-job match scores. |
| `job-analyses` | Job description analyses. |
| `parsed-profiles` | Parsed resume profiles. |
| `interview-preps` | Interview preparation results. |
| `resume-suggestions` | Resume improvement suggestions. |
| `usage` | AI usage records (tokens and cost). |

| |
|---|
| `curl https://trackedyourfuture.com/api/v1/ai/match-scores \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN"` |

An unknown slug returns `404` with the error code `not_found`.

#### GET /ai/{feature}/{itemId}

Returns a single item for the given feature. Scope: `read`.

### Profile settings

#### GET /settings/profile

Returns the caller's profile. Scope: `read`.

| |
|---|
| `{`<br>`  "id": "0c0a...",`<br>`  "name": "Jane Doe",`<br>`  "email": "jane@example.com",`<br>`  "image": null`<br>`}` |

#### PATCH /settings/profile

Updates the caller's display name. Scope: `write`. Returns the updated profile.

Request body:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | Yes | 1 to 100 characters. |

| |
|---|
| `curl -X PATCH https://trackedyourfuture.com/api/v1/settings/profile \`<br>`  -H "Authorization: Bearer tyf_YOUR_TOKEN" \`<br>`  -H "Content-Type: application/json" \`<br>`  -d '{ "name": "Jane A. Doe" }'` |

## Security notes

The following properties hold for every endpoint:

| Property | Description |
|----------|-------------|
| Tenant isolation | Every query is scoped to the token owner. Requesting another user's resource by ID returns `404`, never that user's data. |
| Token storage | Only a SHA-256 hash of each token is stored. Plaintext is shown once at creation and is unrecoverable. |
| Revocation and expiry | Revoked or expired tokens are rejected with `401` immediately. |
| Scope enforcement | Read tokens cannot perform write operations. |
| Encryption at rest | Form-field template values are encrypted at rest and decrypted only in responses. |
| Transport | All requests must use HTTPS. |

## Versioning

This document describes API version `v1`. Additive, backward-compatible changes (new endpoints, new optional fields) may be made within `v1`. Backward-incompatible changes will be released under a new version prefix.
