# Phase 6: User Onboarding

## "System Initialization Protocol" Wizard

Multi-step onboarding flow shown to new users on first dashboard visit.

### Steps

1. **Enter name** -- prefilled from OAuth if available
2. **Create first role category** -- name, description, color picker
3. **Optional CV upload** -- retro progress bar, triggers async AI parsing
4. **Summary "ID Card"** -- displays user info + `[ INITIALIZE DASHBOARD ]` button

### Implementation

- Onboarding state tracked via user record (e.g., `onboardingCompleted` boolean or timestamp)
- Wizard renders inside dashboard layout but replaces main content
- Each step validates before advancing
- CV upload uses the same presigned URL flow as document management
- AI parsing triggered asynchronously after upload confirmation
- Skip button available on step 3 (CV upload)

## Status

- [ ] Onboarding state tracking
- [ ] Step 1: Name entry
- [ ] Step 2: First role category creation
- [ ] Step 3: CV upload with progress bar
- [ ] Step 4: Summary card + initialize button
- [ ] Skip functionality
- [ ] Redirect logic (show wizard vs dashboard)
