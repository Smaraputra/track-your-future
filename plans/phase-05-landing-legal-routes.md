# Phase 5: Landing Page, Legal Pages, Route Structure

## App Router Structure

```
src/app/
  (public)/
    page.tsx                    # Landing
    login/page.tsx
    register/page.tsx
    privacy/page.tsx
    terms/page.tsx
    verify-email/page.tsx
    reset-password/page.tsx
    pricing/page.tsx
  (dashboard)/
    layout.tsx                  # Sidebar + header + notification bell
    page.tsx                    # Dashboard
    roles/
      page.tsx
      new/page.tsx
      [roleId]/page.tsx
      [roleId]/edit/page.tsx
    applications/
      page.tsx
      new/page.tsx
      [applicationId]/page.tsx
      [applicationId]/edit/page.tsx
    analytics/page.tsx
    settings/page.tsx
  api/
    auth/[...nextauth]/route.ts
    checkout/route.ts
    webhooks/stripe/route.ts
    documents/
      presign/route.ts
      [documentId]/confirm/route.ts
      [documentId]/download/route.ts
    ai/
      parse-cv/route.ts
      extract-jd/route.ts
      match/route.ts
      cover-letter/route.ts
      interview-prep/route.ts
      resume-suggestions/route.ts
    settings/
      export/route.ts
      account/route.ts
```

## Landing Page

"Boot sequence" animation (first visit only, cookie-based):
- Text scrolling simulating system boot
- Features listed as "system capabilities"
- Terminal-style email signup
- CTA to register, footer links to privacy/terms

## Legal Pages

- `/privacy` -- Privacy Policy
- `/terms` -- Terms of Service
- Cookie consent banner (accept/decline with localStorage persistence)
- Registration: ToS checkbox required

## GDPR Endpoints

- `GET /api/settings/export` -- Export all user data as JSON
- `DELETE /api/settings/account` -- Hard delete user + MinIO files + Stripe cancel

## Status

- [x] Route structure created (all page stubs)
- [x] (public) layout
- [x] (dashboard) layout with sidebar + header
- [x] Landing page with boot sequence animation
- [x] Privacy policy page
- [x] Terms of service page
- [x] Cookie consent banner
- [x] GDPR export endpoint
- [x] GDPR account deletion endpoint
