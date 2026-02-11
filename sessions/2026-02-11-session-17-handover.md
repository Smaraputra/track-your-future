# Session 17 Handover -- Dashboard Retro Terminal + Onboarding Standalone Layout

## Date
2026-02-11

## Summary
Moved onboarding to a standalone fullscreen route group and applied retro terminal aesthetic to all dashboard components.

## Changes Made

### Part 1: Onboarding Standalone Route Group
- Created `src/app/(onboarding)/layout.tsx` -- minimal auth-only wrapper, no sidebar/header/SubscriptionProvider
- Created `src/app/(onboarding)/onboarding/page.tsx` -- fullscreen MatrixRain + centered RetroWindow (`sys://initialize`)
- Deleted `src/app/(dashboard)/onboarding/page.tsx`
- Simplified `src/components/onboarding/onboarding-guard.tsx` -- removed dead `usePathname` check since `/onboarding` is no longer inside `(dashboard)`

### Part 1b: Onboarding Step Retro Enhancements
- Added terminal prompts to all 4 onboarding steps:
  - step-name: `user@tyf:~$ init --step=identity`
  - step-role: `user@tyf:~$ init --step=role`
  - step-cv-upload: `user@tyf:~$ init --step=documents`
  - step-summary: `user@tyf:~$ init --step=confirm`
- Added `text-shadow-glow` to all step headings
- Replaced numbered circle progress indicators with terminal-style: `INIT [##..] step N/4`

### Part 2: Dashboard Retro Terminal Aesthetic
- **Header**: `crt-screen`, `backdrop-blur-sm`, terminal prompt `user@tyf:~$` with blinking cursor (desktop only), `border-glow-sweep` divider, glow on page title
- **Sidebar**: `crt-screen`, `text-shadow-glow` on TYF logo, `border-glow` on active nav item, version footer `TYF v2.0.26`
- **Dashboard content**: terminal prompts before each section (`cat /sys/status`, `cat /var/log/alerts`, `tail -f /var/log/activity`, `ls /sys/roles/`), `text-shadow-glow` on all section headings
- **Stat card**: `crt-screen border-glow`, glowing value text
- **Stale apps list**: `crt-screen border-glow` on each item
- **Activity feed**: `border-glow` on hover, `text-phosphor` on company names
- **Quick links**: `border-glow` on role category links, `text-phosphor` on bottom nav links
- **Upgrade CTA**: `crt-screen border-glow`, glowing "Upgrade to Pro" heading

### Test Updates
- Updated `tests/unit/onboarding-wizard.test.tsx` -- progress indicator test now checks for `INIT` text and `step 1/4` instead of CSS class selectors

## Verification
- `pnpm lint` -- zero errors
- `pnpm typecheck` -- zero errors
- `pnpm test` -- 1299 tests pass (78 files, 14 skipped integration)
- `pnpm build` -- clean production build
- Visual verification via Chrome DevTools MCP:
  - Dashboard: retro terminal prompts, CRT effects on cards, glowing stat values, border-glow, version footer
  - Onboarding: fullscreen MatrixRain background, no sidebar/header, centered RetroWindow, terminal progress bar

## Commit
`b6ba570` -- `feat(ui): retro terminal upgrade for dashboard and standalone onboarding`

## Remaining Unstaged Changes
Previous session work still uncommitted: landing page redesign, globals.css additions, matrix-rain/typewriter-text components, public layout changes, auth page tweaks, retro button/window updates, appearance tab, E2E/unit test updates. These were already in the working tree before this session started.

## Architecture Notes
- OnboardingGuard logic simplified: since `/onboarding` is no longer a dashboard route, the guard simply redirects any incomplete user to `/onboarding` without needing a pathname check
- Auth middleware (`publicPaths` in `src/auth.ts`) does not include `/onboarding` -- it requires authentication, handled by the (onboarding) layout's own `auth()` check
- No circular redirect risk: guard runs inside (dashboard) layout only, redirects to (onboarding) route group which has its own independent layout
