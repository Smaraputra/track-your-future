# Session 12 Handover -- 2026-02-09

## Summary

Implemented Step 14: AI CV Parsing. All 7 commits completed. 865 unit tests passing (93 new), plus 6 integration tests (skipped without DATABASE_URL).

## What Was Done

### Commit 1: chore(ai): install AI dependencies
- Added ai@6.0.77, @ai-sdk/openai@3.0.26, pdf-parse@2.4.5, mammoth@1.11.0

### Commit 2: feat(ai): add provider infrastructure and usage tracking
- Created `src/lib/ai/providers.ts`: OpenAI provider via createOpenAI
- Created `src/lib/ai/models.ts`: MODELS object with all 6 AI features mapped to models, MODEL_NAMES string mapping
- Created `src/lib/ai/costs.ts`: calculateCost pure function (separated from DB code for testability)
- Created `src/lib/ai/usage.ts`: logAiUsage inserts into aiUsage table, uses AiDbFeature type (narrower than AiFeatureKey to match DB enum which lacks jd_extraction)
- Created `src/lib/ai/index.ts`: barrel exports

### Commit 3: feat(ai): add S3 download and text extraction
- Added `getObjectBuffer(fileKey)` to `src/lib/minio/presign.ts`: streams S3 response body into Buffer
- Created `src/lib/ai/text-extraction.ts`: extractTextFromPdf (PDFParse v2 class API), extractTextFromDocx (mammoth.extractRawText), extractText dispatcher with MIME type validation and 50-char minimum text check

### Commit 4: feat(ai): add CV structured extraction with LLM
- Created `src/lib/ai/schemas.ts`: cvParsedDataSchema Zod schema with all fields (contact, skills, experience, education, certifications, languages), all with .describe() for LLM guidance
- Created `src/lib/ai/cv-parser.ts`: parseCvText using generateText + Output.object from AI SDK 6, 100K char truncation, system prompt with YYYY-MM date format rules; calculateConfidence heuristic

### Commit 5: feat(ai): add parse-cv API route
- Created `POST /api/ai/parse-cv`: auth, body validation (documentId UUID), document ownership + type check (cv only), canAccess/checkAiLimit, OPENAI_API_KEY check (503), S3 download, text extraction, LLM parse, upsert (delete old + insert new in transaction), usage logging
- Created `GET /api/ai/parse-cv/[documentId]`: fetch parsed profile by documentId + userId
- Modified `POST /api/documents/confirm`: replaced TODO with canParse flag in response

### Commit 6: feat(ai): add parsed profile UI to documents page
- Created `ParseCvButton`: calls parse API, shows "Parse CV"/"Re-parse", loading spinner, error messages (429 limit, 503 config)
- Created `ParsedProfileViewer`: dialog displaying parsed CV data in sections (Contact, Summary, Skills tags, Experience, Education, Certifications, Languages), confidence score, lazy fetch on dialog open (avoids setState-in-useEffect ESLint rule)
- Extended DocumentItem with parsedProfileId, DocumentRow with onParse callback, "Parsed" badge with viewer trigger
- Added handleParsed callback to DocumentsPageContent, passes onParse to DocumentRow
- LEFT JOIN parsedProfiles in: documents API route, documents page, role detail page

### Commit 7: test(ai): add integration tests and update plans
- 6 integration tests: insert parsedProfile, cascade delete, aiUsage insertion, upsert pattern, multi-tenancy
- Updated plans/phase-08-ai-features.md: first 4 checkboxes checked
- Updated plans/phase-12-implementation-sequence.md: Step 14 -> Complete

## Verification Checklist
- [x] pnpm lint -- zero errors, zero warnings
- [x] pnpm typecheck -- zero type errors
- [x] pnpm test -- 865 passing (93 new unit, 6 new integration skipped without DATABASE_URL)
- [x] pnpm build -- clean production build

## Key Technical Decisions
- **Separated costs.ts from usage.ts**: Pure calculateCost function in its own file avoids importing db (which requires DATABASE_URL), same pattern as canAccess in plans.ts
- **AiDbFeature type**: Narrower than AiFeatureKey because the DB aiFeatureEnum doesn't include 'jd_extraction'. Prevents type errors when inserting into aiUsage table
- **Output.object vs output.object**: AI SDK 6 exports `output` as `Output` (capital O) -- the namespace is lowercase internally but re-exported capitalized
- **result.output vs result.object**: GenerateTextResult uses `output` property (not `object`) for structured output in AI SDK 6
- **ParsedProfileViewer fetch on open**: Used useCallback handler in onOpenChange instead of useEffect to avoid React 19 ESLint `set-state-in-effect` rule
- **PDF text extraction**: pdf-parse v2 uses class-based API (new PDFParse({data}), getText(), destroy())
- **mammoth import**: Default import works with ESM (`import mammoth from 'mammoth'`), TS types inferred via allowJs
- **parsedProfileId propagation**: Added to DocumentItem interface, LEFT JOIN in all document queries (API route, page, role detail page)

## Files Created (11)
- `src/lib/ai/providers.ts`, `models.ts`, `costs.ts`, `usage.ts`, `index.ts`
- `src/lib/ai/text-extraction.ts`, `schemas.ts`, `cv-parser.ts`
- `src/app/api/ai/parse-cv/route.ts`, `[documentId]/route.ts`
- `src/components/documents/parse-cv-button.tsx`, `parsed-profile-viewer.tsx`

## Files Modified (8)
- `package.json` (added ai, @ai-sdk/openai, pdf-parse, mammoth)
- `src/lib/minio/presign.ts` (added getObjectBuffer)
- `src/lib/minio/index.ts` (added export)
- `src/app/api/documents/confirm/route.ts` (canParse flag)
- `src/app/api/documents/route.ts` (LEFT JOIN parsedProfiles)
- `src/app/(dashboard)/documents/page.tsx` (LEFT JOIN parsedProfiles)
- `src/app/(dashboard)/roles/[roleId]/page.tsx` (LEFT JOIN parsedProfiles)
- `src/components/documents/document-row.tsx` (parsedProfileId, onParse, ParseCvButton, Parsed badge)
- `src/components/documents/documents-page-content.tsx` (handleParsed callback)

## Test Files Created (5)
- `tests/unit/ai-infrastructure.test.ts` (20 tests)
- `tests/unit/ai-text-extraction.test.ts` (18 tests)
- `tests/unit/ai-cv-parser.test.ts` (19 tests)
- `tests/unit/ai-parse-cv-api.test.ts` (21 tests)
- `tests/unit/ai-parse-ui.test.tsx` (15 tests)
- `tests/integration/ai-cv-parsing.test.ts` (6 tests)

## Test Files Modified (1)
- `tests/unit/documents-page.test.tsx` (added parsedProfileId to mock data, Sparkles/Loader2 to lucide mock)

## Git State
- Branch: main
- 7 commits made in this session (4cd73da through e3f9f74)

## Next Steps
- Step 15: AI JD extraction (Jina Reader + LLM) -- per plans/phase-12-implementation-sequence.md
- Step 17: AI Match scoring + gap analysis (plugs into application detail page AI placeholders)
