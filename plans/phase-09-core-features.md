# Phase 9: Core Features

## 9.1 Role Categories CRUD

- Server Components + Server Actions
- List with color badges, drag-to-reorder (position field)
- Create/edit: name, description, color picker, position
- Delete with confirmation dialog
- Unique constraint: (userId, name)

### Pages
- `/roles` -- list view
- `/roles/new` -- create form
- `/roles/[roleId]` -- detail (linked documents + form fields)
- `/roles/[roleId]/edit` -- edit form

## 9.2 Form Field Templates CRUD

- Per role category, key-value pairs
- Inline editing (click to edit)
- Drag-to-reorder (position field)
- One-click copy to clipboard
- Unique constraint: (roleCategoryId, fieldKey)

### UI
- Rendered inside role category detail page (`/roles/[roleId]`)
- Add field inline
- Edit key/value inline
- Delete with confirmation

## 9.3 Document Upload/Download (MinIO)

Presigned URL flow (never proxy binary through Node):

1. `POST /api/documents/presign` -> create pending row + return presigned PUT URL
2. Client uploads directly to MinIO via XHR (progress tracking)
3. `POST /api/documents/{id}/confirm` -> verify object exists + activate row
4. After confirm, trigger async CV parsing if document type is CV

### Download
- `GET /api/documents/{documentId}/download` -> redirect to presigned GET URL

### File Organization in MinIO
```
{userId}/{roleCategoryId}/{documentType}/{documentId}/v{version}/{filename}
```

### Versioning
- Increment version number on re-upload
- Set `isLatest=false` on previous version
- Query latest version by default

### Constraints
- Allowed types: PDF, DOCX
- Max size: 10 MB
- Validated server-side before presign

## 9.4 Applications CRUD + Status Pipeline

### Create
- Company name, job title, URL (triggers JD extraction), role category, notes
- URL paste auto-fills company + title via AI extraction

### Status Pipeline
```
draft -> applied -> phone_screen -> interview -> offer
                                               -> rejected
                                               -> ghosted
                                               -> withdrawn
```

### Status Change
- Transactional: update `applications.currentStatus` + insert `application_status_history`
- Dropdown or Kanban-style drag

### List View
- Filters: status, role category, date range
- URL params via `nuqs` for shareable/bookmarkable filter state
- Sort by: updatedAt, companyName, appliedAt

### Detail Page
- Status history timeline
- Match score (retro gauge)
- Linked documents
- AI actions: extract JD, match score, cover letter, interview prep

## 9.5 Dashboard

- Summary stat cards: total applications, by-status counts
- Stale application reminders (7+ days without update, exclude terminal statuses)
- Recent activity feed
- Quick links to role categories
- Pro upgrade prompts for free tier users

## 9.6 Analytics Page (Pro only)

- Conversion funnel: applied -> phone_screen -> interview -> offer
- Breakdown by role category
- Status distribution chart (recharts)
- Free tier: current month only
- Pro: all time

## Status

- [x] 9.1 Role categories CRUD
- [ ] 9.2 Form field templates CRUD
- [ ] 9.3 Document upload/download (MinIO presigned URLs)
- [ ] 9.4 Applications CRUD + status pipeline
- [ ] 9.5 Dashboard
- [ ] 9.6 Analytics page
