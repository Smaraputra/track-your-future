# Phase 10: Notifications

## In-App Notifications

- Notification bell in header with unread count badge
- Stored in `notifications` table
- Mark as read on click
- Mark all as read action
- Dropdown list with recent notifications

## Email Notifications (Pro only)

- Weekly digest: stale applications + action items
- Sent via `nodemailer` (SMTP)
- Unsubscribe link in email footer

## Notification Types

| Type | Trigger | Channel |
|------|---------|---------|
| `stale_app` | Application unchanged for 7+ days (non-terminal) | In-app + Email (Pro) |
| `follow_up` | Reminder to follow up after interview | In-app + Email (Pro) |
| `weekly_summary` | Weekly application activity summary | Email (Pro) |
| `milestone` | Achievement (e.g., 10th application, first offer) | In-app |

## Scheduling

- `node-cron` in separate Docker process OR Vercel Cron (production)
- Daily check for stale applications
- Weekly digest generation

## Status

- [x] Notification bell component
- [x] Notification dropdown
- [x] Mark as read
- [x] Stale application detection cron
- [x] Email digest (Pro)
- [x] Milestone detection
