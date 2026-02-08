# Phase 8: AI Features

## Architecture

Multi-provider via Vercel AI SDK (`ai` package).

### Files

- `src/lib/ai/providers.ts` -- provider setup (OpenAI, Anthropic, Google)
- `src/lib/ai/models.ts` -- task-to-model routing
- `src/lib/ai/usage.ts` -- track every AI call in `ai_usage` table, enforce plan limits

### Model Routing

| Task | Model | Approx Cost/Request |
|------|-------|---------------------|
| CV text extraction | pdf-parse + mammoth (no AI) | $0 |
| CV structured extraction | GPT-4.1-nano | ~$0.0005 |
| JD extraction (text/URL) | GPT-4.1-nano | ~$0.0005 |
| Match scoring + gap analysis | GPT-4o-mini | ~$0.001 |
| Cover letter generation | GPT-4.1 or Claude Sonnet 4 | ~$0.015 |
| Interview prep questions | GPT-4o-mini | ~$0.001 |
| Resume improvement suggestions | GPT-4.1 | ~$0.015 |

## 8.1 CV Parsing (on upload)

- **Text extraction**: `pdf-parse` for PDF, `mammoth` for DOCX
- **Structured extraction**: Send raw text to GPT-4.1-nano with JSON schema enforcement
- **Fields**: name, email, phone, location, summary, skills[], experience[], education[]
- **Flow**: Upload -> text extract -> LLM structured extract -> store in `parsed_profiles` -> user confirms/edits
- **Trigger**: Async after document upload confirmation
- **API**: `POST /api/ai/parse-cv`

## 8.2 Job Description Extraction

- **From URL**: Jina Reader API (`https://r.jina.ai/{url}`) for HTML-to-text, then GPT-4.1-nano
- **From pasted text**: Direct to LLM
- **Schema**: companyName, jobTitle, location, locationType, salaryMin/Max, requiredSkills[], preferredSkills[], experienceYears, educationRequired
- **Caching**: Cache by URL SHA-256 hash in Redis. Shared across users.
- **UX**: Paste URL in "New Application" form -> auto-fill company, title, skills
- **API**: `POST /api/ai/extract-jd`

## 8.3 Match Scoring + Gap Analysis

- **Input**: Parsed CV + extracted JD
- **Output**: overallScore (0-100), skillsMatch, experienceMatch, educationMatch, keywordCoverage, strengths[], weaknesses[], suggestions[]
- **UX**: Score displayed as retro gauge on application detail. Gap items as actionable list.
- **API**: `POST /api/ai/match`

## 8.4 Cover Letter Generation

- **Input**: Parsed CV + JD + tone preset
- **Tone presets**: Formal/Corporate, Startup/Casual, Technical, Leadership
- **UX**: Generate button on application detail. Streamed output. Editable. Save as document. Regenerate with different emphasis.
- **Limit**: 20/month on Pro, 0 on Free
- **API**: `POST /api/ai/cover-letter`

## 8.5 Interview Prep Question Generator

- **Input**: JD + company context
- **Output**: Categorized questions (behavioral, technical, situational) with STAR framework answer stubs
- **UX**: "Interview Prep" section on application detail, visible when status is phone_screen or interview
- **API**: `POST /api/ai/interview-prep`

## 8.6 Resume Improvement Suggestions

- **Input**: Parsed CV (optionally compared to specific JD)
- **Output**: Bullet point rewrites, quantification suggestions, ATS keyword optimization, structure recommendations
- **UX**: Available on document detail page for CV-type documents
- **API**: `POST /api/ai/resume-suggestions`

## Caching Strategy

1. **Provider prompt caching**: Repeated system prompts cached by OpenAI/Anthropic (75-90% off input)
2. **Application cache**: Redis cache for identical inputs (resume hash + JD hash -> result), 30-day TTL
3. **JD URL cache**: Cache by URL SHA-256 hash, share across users
4. **Batch re-scoring**: When user updates CV, re-score all active applications via Batch API (50% off)

## Status

- [ ] AI provider setup (Vercel AI SDK)
- [ ] Model routing config
- [ ] Usage tracking + limit enforcement
- [ ] 8.1 CV parsing pipeline
- [ ] 8.2 JD extraction (URL + text)
- [ ] 8.3 Match scoring + gap analysis
- [ ] 8.4 Cover letter generation (streaming)
- [ ] 8.5 Interview prep questions
- [ ] 8.6 Resume improvement suggestions
- [ ] Redis caching layer
