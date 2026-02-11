# Session 07 Handover -- 2026-02-09

## Summary

Implemented Step 13: Document Upload/Download (MinIO Presigned URLs). All 7 commits completed. 661 tests passing (90 new tests added to previous 571).

## What Was Done

### Commit 1: feat(minio): add S3 client and presigned URL utilities
- Installed `@aws-sdk/client-s3` (v3.985.0) and `@aws-sdk/s3-request-presigner` (v3.985.0)
- Created `src/lib/minio/client.ts`: S3Client singleton with globalThis hot-reload pattern (matching db/index.ts), forcePathStyle for MinIO, env var config
- Created `src/lib/minio/presign.ts`: createPresignedPutUrl (10min expiry), createPresignedGetUrl (1hr expiry, Content-Disposition attachment), headObject, deleteObject, deleteObjects
- Created `src/lib/minio/index.ts`: barrel exports
- Added `MINIO_API_CORS_ALLOW_ORIGIN: "*"` to docker-compose.yml minio service (required for browser XHR PUT)

### Commit 2: feat(documents): add validation schemas and utilities
- Created `src/lib/documents/schemas.ts`: presignRequestSchema (Zod with .refine for custom type), confirmUploadSchema, ALLOWED_MIME_TYPES (pdf, docx), MAX_FILE_SIZE_BYTES (10MB), DOCUMENT_TYPES
- Created `src/lib/documents/file-key.ts`: buildFileKey generating `{userId}/{roleOrUnassigned}/{type}/{docId}/v{version}/{fileName}`
- Created `src/lib/documents/index.ts`: barrel exports
- Fixed `countDocuments` in `src/lib/billing/feature-gate.ts`: added `eq(documents.isLatest, true)` filter so re-uploads don't consume document slots

### Commit 3: feat(documents): add API routes
- `GET /api/documents`: List with isLatest=true filter, LEFT JOIN roleCategories, optional type/role query params
- `POST /api/documents/presign`: Validate, check document + storage limits, verify role ownership, handle versioning via previousDocumentId, generate fileKey + presigned PUT URL, no DB row created
- `POST /api/documents/confirm`: Validate, headObject to verify file + get actual size, re-check storage with actual size, transaction to set old version isLatest=false + insert new doc
- `GET/DELETE /api/documents/[documentId]`: Auth-scoped CRUD, DELETE removes from MinIO and promotes previous version
- `GET /api/documents/[documentId]/download`: Presigned GET URL redirect

### Commit 4: feat(documents): add upload hook and dialog
- Created `src/hooks/use-document-upload.ts`: State machine (idle/presigning/uploading/confirming/success/error), XHR for upload progress, cancel/reset
- Created `src/components/documents/upload-dialog.tsx`: Document type select, conditional custom type name, optional role select, file input with validation, progress bar, cancel during upload
- Created `src/components/documents/upload-progress-bar.tsx`: Retro-themed progress bar with hash blocks

### Commit 5: feat(documents): add documents page with list and actions
- Replaced `src/app/(dashboard)/documents/page.tsx` stub with server component fetching docs, roles, subscription
- Created `DocumentsPageContent`: Client component with type/role client-side filters, upload button, storage indicator
- Created `DocumentRow`: File icon, name, type badge, role badge, version, size, date, download/delete buttons
- Created `DocumentTypeBadge`: Badge rendering for document types
- Created `DeleteDocumentDialog`: Confirmation dialog following DeleteTemplateDialog pattern
- Created `StorageIndicator`: Usage bar with hash blocks, red when >90%

### Commit 6: feat(documents): integrate into role detail page and GDPR cleanup
- Replaced Step 13 placeholder (lines 138-142) in `src/app/(dashboard)/roles/[roleId]/page.tsx` with `RoleDocumentList` component
- Added queries for role-scoped documents, all roles list, document limit
- Created `RoleDocumentList`: Scoped to single role, upload dialog pre-fills roleCategoryId
- Updated `src/app/api/settings/account/route.ts`: Replaced MinIO TODO with actual cleanup (query fileKeys, deleteObjects)

### Commit 7: test(documents): add unit and integration tests
- `documents-schemas.test.ts`: 27 tests for presignRequestSchema, confirmUploadSchema, buildFileKey
- `documents-api.test.ts`: 31 tests via readFileSync source analysis for all 5 API route files
- `documents-page.test.tsx`: 9 tests for DocumentsPageContent rendering, filters, badges, empty state
- `documents-upload.test.tsx`: 12 tests for UploadProgressBar states and UploadDialog rendering
- `feature-gate-documents.test.ts`: 3 tests verifying countDocuments has isLatest filter, sumStorageBytes does not
- `documents-crud.test.ts`: 9 integration tests (insert, versioning, count, storage sum, delete with promotion, role cascade/set-null, user cascade, multi-tenancy)
- Updated `gdpr-endpoints.test.ts`: Changed "has TODO for MinIO file cleanup" to verify actual deleteObjects usage

## Verification Checklist
- [x] pnpm lint -- zero errors
- [x] pnpm typecheck -- zero type errors
- [x] pnpm test -- 661 passing (90 new)
- [x] pnpm build -- clean production build (34 routes + 12 API routes)

## Key Technical Decisions
- **No DB row at presign time**: Avoids orphan rows if upload fails. Row created only at confirm after headObject verification.
- **Versioning via previousDocumentId**: Client explicitly requests re-upload. Presign checks previous doc is latest, confirm sets old doc isLatest=false in transaction.
- **Document count = isLatest rows only**: Re-uploading doesn't consume a document slot. Storage counts all versions (no isLatest filter on sumStorageBytes).
- **XHR for upload progress**: Fetch API doesn't support upload progress. Custom hook wraps XHR with state machine.
- **Confirm uses actual file size from headObject**: Prevents clients from lying about size to bypass storage limits. Deletes file if post-upload limit check fails.
- **Delete promotes previous version**: When deleting the latest version, finds the highest remaining version and sets it as latest.
- **Role delete sets document roleCategoryId to null**: Schema uses `onDelete: 'set null'` so documents survive role deletion (unlike templates which cascade).

## Files Created (20)
- `src/lib/minio/client.ts`
- `src/lib/minio/presign.ts`
- `src/lib/minio/index.ts`
- `src/lib/documents/schemas.ts`
- `src/lib/documents/file-key.ts`
- `src/lib/documents/index.ts`
- `src/app/api/documents/route.ts`
- `src/app/api/documents/presign/route.ts`
- `src/app/api/documents/confirm/route.ts`
- `src/app/api/documents/[documentId]/route.ts`
- `src/app/api/documents/[documentId]/download/route.ts`
- `src/hooks/use-document-upload.ts`
- `src/components/documents/upload-dialog.tsx`
- `src/components/documents/upload-progress-bar.tsx`
- `src/components/documents/documents-page-content.tsx`
- `src/components/documents/document-row.tsx`
- `src/components/documents/document-type-badge.tsx`
- `src/components/documents/delete-document-dialog.tsx`
- `src/components/documents/storage-indicator.tsx`
- `src/components/documents/role-document-list.tsx`

## Files Modified (5)
- `package.json` (added @aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
- `docker-compose.yml` (MINIO_API_CORS_ALLOW_ORIGIN)
- `src/lib/billing/feature-gate.ts` (countDocuments isLatest filter)
- `src/app/(dashboard)/documents/page.tsx` (replaced stub)
- `src/app/(dashboard)/roles/[roleId]/page.tsx` (replaced Step 13 placeholder)
- `src/app/api/settings/account/route.ts` (MinIO cleanup)

## Test Files Created/Modified (7)
- `tests/unit/documents-schemas.test.ts` (new, 27 tests)
- `tests/unit/documents-api.test.ts` (new, 31 tests)
- `tests/unit/documents-page.test.tsx` (new, 9 tests)
- `tests/unit/documents-upload.test.tsx` (new, 12 tests)
- `tests/unit/feature-gate-documents.test.ts` (new, 3 tests)
- `tests/integration/documents-crud.test.ts` (new, 9 tests)
- `tests/unit/gdpr-endpoints.test.ts` (modified, updated MinIO test)

## Git State
- Branch: main
- 7 commits made in this session
- Latest commit: `7f4cf81 test(documents): add unit and integration tests`

## Next Steps
- Step 14: AI CV parsing (pdf-parse + mammoth + LLM extraction) per plans/phase-12-implementation-sequence.md
- The confirm route has a TODO comment for triggering async CV parsing when documentType === 'cv'
