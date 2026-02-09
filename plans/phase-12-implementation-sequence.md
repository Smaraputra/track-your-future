# Implementation Sequence

Ordered steps with phase references and effort estimates.

| Step | Phase | Effort | Description | Status |
|------|-------|--------|-------------|--------|
| 1 | 1.1-1.3 | 1 day | Scaffold + Docker + Drizzle setup | Complete |
| 2 | 2 | 1 day | Database schema (all tables) | Complete |
| 3 | 3 | 2-3 days | Auth (NextAuth v5 + credentials + OAuth + email verification) | Complete |
| 4 | 4 | 2 days | Design system + retro components | Complete |
| 5 | 5 | 0.5 day | Route structure + layouts (stubs) | Complete |
| 6 | 11 | 1 day | Legal pages + cookie consent + GDPR endpoints | Complete |
| 7 | 5 | 1-2 days | Landing page (boot animation) | Complete |
| 8 | 3 | 1-2 days | Login/register/verify/reset pages | Complete |
| 9 | 7 | 2-3 days | Stripe billing (checkout, webhooks, portal, feature gating) | Complete |
| 10 | 7 | 0.5 day | Pricing page | Complete |
| 11 | 9.1 | 1-2 days | Role Categories CRUD | Complete |
| 12 | 9.2 | 1 day | Form Field Templates CRUD | Complete |
| 13 | 9.3 | 2 days | Document upload/download (MinIO presigned URLs) | Complete |
| 14 | 8.1 | 2 days | AI: CV parsing (pdf-parse + mammoth + LLM extraction) | Complete |
| 15 | 8.2 | 1 day | AI: JD extraction (Jina Reader + LLM) | Pending |
| 16 | 9.4 | 2-3 days | Applications CRUD + status pipeline | Complete |
| 17 | 8.3 | 1-2 days | AI: Match scoring + gap analysis | Pending |
| 18 | 8.4 | 1-2 days | AI: Cover letter generation | Pending |
| 19 | 8.5 | 1 day | AI: Interview prep | Pending |
| 20 | 8.6 | 1 day | AI: Resume suggestions | Pending |
| 21 | 9.5 | 1-2 days | Dashboard + stale reminders | Pending |
| 22 | 9.6 | 1-2 days | Analytics page | Pending |
| 23 | 10 | 2 days | Notification system (in-app + email digest) | Pending |
| 24 | 6 | 1-2 days | Onboarding flow | Pending |
| 25 | 11 | 1 day | Settings page | Pending |
| 26 | - | 2 days | Responsive polish + error boundaries | Pending |

**Total estimate**: ~30-40 days
