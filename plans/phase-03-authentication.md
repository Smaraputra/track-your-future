# Phase 3: Authentication (NextAuth v5)

## Dependencies

- `next-auth@5`, `@auth/drizzle-adapter`, `bcryptjs`, `@types/bcryptjs`
- `nodemailer`, `@types/nodemailer` (email verification + password reset)

## Core Files

- `src/auth.ts` -- exports `auth`, `handlers`, `signIn`, `signOut`
- `src/app/api/auth/[...nextauth]/route.ts` -- re-exports handlers
- `src/middleware.ts` -- uses `auth` export as middleware for route protection

## Providers

1. **Credentials** -- email/password with bcrypt hashing
2. **Google OAuth** -- via Google Cloud Console
3. **GitHub OAuth** -- via GitHub Developer Settings

## Auth Flows

### Registration
- Email + password + name
- Zod validation on all fields
- Hash password with bcrypt (12 rounds)
- Create user record
- Send verification email with token
- Redirect to "check your email" page

### Email Verification
- Token-based (hashed token in DB, 24hr expiry)
- `GET /verify-email?token=xxx` verifies and activates account
- Show success/error page

### Login
- Email + password via credentials provider
- OR OAuth via Google/GitHub
- Rate limiting: 5 failed attempts in 15 minutes triggers lockout
- Lockout duration: 15 minutes

### Password Reset
- Request: email input -> send reset email with token
- Token: hashed, 1-hour expiry, single-use (`usedAt` column)
- Reset: new password form -> validate token -> update hash

## Security

- HTTP-only, Secure, SameSite cookies
- CSRF protection (built-in NextAuth)
- Zod validation on all auth inputs
- Multi-tenancy: every query scoped by `session.user.id`
- Rate limiting on auth API routes

## Pages

- `/login` -- email/password form + OAuth buttons
- `/register` -- registration form with ToS checkbox
- `/verify-email` -- token verification handler
- `/reset-password` -- request form + new password form

## Status

- [x] NextAuth v5 configured with Drizzle adapter
- [x] Credentials provider (email/password)
- [x] Google OAuth provider
- [x] GitHub OAuth provider
- [x] Email verification flow
- [x] Password reset flow
- [x] Rate limiting on auth endpoints
- [x] Proxy (middleware) for route protection
- [x] Auth pages (login, register, verify, reset) -- implemented in Step 8
