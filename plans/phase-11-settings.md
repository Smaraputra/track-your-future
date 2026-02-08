# Phase 11: Settings Page

## Sections

### Appearance
- Theme toggle (green/amber)
- CRT overlay toggle

### Profile
- Edit name
- Edit email (with re-verification)

### Security
- Change password (current + new + confirm)
- Connected OAuth accounts

### Subscription
- Current plan display
- "Manage Subscription" button -> Stripe Customer Portal redirect
- AI usage dashboard: credits used/remaining per feature this month

### Data
- Export data button (JSON download, CSV for Pro)
- Account deletion button with confirmation dialog

## Account Deletion Flow

1. User clicks "Delete Account"
2. Confirmation dialog with email re-entry
3. On confirm:
   - Cancel Stripe subscription (if active)
   - Delete all MinIO files for user
   - Hard delete all user data from database
   - Sign out and redirect to landing page

## Status

- [ ] Settings page layout
- [ ] Theme toggle
- [ ] Profile editing
- [ ] Password change
- [ ] Subscription management
- [ ] AI usage dashboard
- [ ] Data export (JSON + CSV)
- [ ] Account deletion
