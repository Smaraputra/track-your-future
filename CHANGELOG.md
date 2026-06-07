# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-06-07

First public release. Feature-complete job-search command center with a retro
terminal UI, backed by 1400+ unit and integration tests.

### Added

#### Authentication and security

- Email and password authentication with Google and GitHub OAuth (NextAuth v5).
- Email verification and password reset, with hashed single-use tokens.
- Per-email login lockout and rate limiting on authentication endpoints.
- Cloudflare Turnstile on all public auth forms.
- Per-request Content Security Policy nonces and security headers.
- Application-level AES-256-GCM encryption for sensitive columns (form-field answers).
- Audit log for sensitive account actions.

#### Job-search workspace

- Role categories to organize applications, documents, and reusable answers.
- Reusable form-field templates with values encrypted at rest.
- Document storage for CVs and cover letters via S3-compatible presigned URLs, with versioning.
- Application tracking through a status pipeline with status history and milestone notifications.

#### AI suite

- CV parsing, job-description extraction, match scoring, cover-letter generation,
  interview preparation, and resume suggestions.
- Per-plan, per-feature monthly usage limits, with usage tracked in the database.
- Multi-provider support (OpenAI, Mistral) and Redis-backed result caching.

#### Product surfaces

- Dashboard with stats, stale-application alerts, activity feed, and quick links.
- Analytics with charts, a status funnel, and per-role breakdowns.
- In-app notifications with stale detection and milestones.
- Four-step onboarding wizard.
- Settings for profile, security, appearance, subscription, and data export/delete.

#### Billing

- Stripe and Polar billing with checkout, trials, and a customer portal.
- Free and Pro tiers with plan-limit enforcement.
- A billing-disabled mode that grants all users Pro access.

#### Platform

- Versioned REST API under `/api/v1` with scoped personal API tokens.
- Retro terminal UI with green and amber themes and a CRT overlay.
- GDPR cookie consent and full data export and deletion.
- Error boundaries, loading states, and custom 404 pages.
- Multi-stage Docker build and self-hosted deployment behind Caddy, with
  automatic migrations on container start.

[1.0.0]: https://github.com/Smaraputra/track-your-future/releases/tag/v1.0.0
