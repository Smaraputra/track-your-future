import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Notification API routes', () => {
  const listRoute = readFileSync(
    resolve(ROOT, 'src/app/api/notifications/route.ts'),
    'utf-8',
  );
  const unreadCountRoute = readFileSync(
    resolve(ROOT, 'src/app/api/notifications/unread-count/route.ts'),
    'utf-8',
  );
  const markReadRoute = readFileSync(
    resolve(ROOT, 'src/app/api/notifications/[id]/read/route.ts'),
    'utf-8',
  );
  const markAllReadRoute = readFileSync(
    resolve(ROOT, 'src/app/api/notifications/read-all/route.ts'),
    'utf-8',
  );
  const detectStaleRoute = readFileSync(
    resolve(ROOT, 'src/app/api/notifications/detect-stale/route.ts'),
    'utf-8',
  );

  describe('GET /api/notifications', () => {
    it('exports GET handler', () => {
      expect(listRoute).toContain('export async function GET');
    });

    it('checks authentication', () => {
      expect(listRoute).toContain('auth()');
      expect(listRoute).toContain('Unauthorized');
    });

    it('queries notifications for user', () => {
      expect(listRoute).toContain('notifications');
      expect(listRoute).toContain('userId');
    });

    it('orders by createdAt descending', () => {
      expect(listRoute).toContain('desc(notifications.createdAt)');
    });

    it('limits results', () => {
      expect(listRoute).toContain('.limit(50)');
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('exports GET handler', () => {
      expect(unreadCountRoute).toContain('export async function GET');
    });

    it('counts unread notifications', () => {
      expect(unreadCountRoute).toContain('isRead');
      expect(unreadCountRoute).toContain('count');
    });
  });

  describe('PATCH /api/notifications/[id]/read', () => {
    it('exports PATCH handler', () => {
      expect(markReadRoute).toContain('export async function PATCH');
    });

    it('sets isRead to true', () => {
      expect(markReadRoute).toContain('isRead: true');
    });

    it('scopes by userId for security', () => {
      expect(markReadRoute).toContain('notifications.userId');
    });

    it('returns 404 for not found', () => {
      expect(markReadRoute).toContain('404');
    });
  });

  describe('POST /api/notifications/read-all', () => {
    it('exports POST handler', () => {
      expect(markAllReadRoute).toContain('export async function POST');
    });

    it('marks all unread as read', () => {
      expect(markAllReadRoute).toContain('isRead: true');
      expect(markAllReadRoute).toContain('isRead, false');
    });
  });

  describe('POST /api/notifications/detect-stale', () => {
    it('exports POST handler', () => {
      expect(detectStaleRoute).toContain('export async function POST');
    });

    it('calls detectStaleApps', () => {
      expect(detectStaleRoute).toContain('detectStaleApps');
    });
  });
});

describe('Stale detection logic', () => {
  const staleDetection = readFileSync(
    resolve(ROOT, 'src/lib/notifications/stale-detection.ts'),
    'utf-8',
  );

  it('uses 7 day threshold', () => {
    expect(staleDetection).toContain('STALE_DAYS = 7');
  });

  it('excludes terminal statuses', () => {
    expect(staleDetection).toContain('offer');
    expect(staleDetection).toContain('rejected');
    expect(staleDetection).toContain('ghosted');
    expect(staleDetection).toContain('withdrawn');
  });

  it('deduplicates by checking existing notifications', () => {
    expect(staleDetection).toContain('existing');
    expect(staleDetection).toContain('stale_app');
  });

  it('only creates for unread stale notifications', () => {
    expect(staleDetection).toContain('isRead, false');
  });
});

describe('Milestone detection logic', () => {
  const milestones = readFileSync(
    resolve(ROOT, 'src/lib/notifications/milestones.ts'),
    'utf-8',
  );

  it('detects first application', () => {
    expect(milestones).toContain('First Application Created');
  });

  it('detects 10th application', () => {
    expect(milestones).toContain('10 Applications');
  });

  it('detects first offer', () => {
    expect(milestones).toContain('First Offer Received');
  });

  it('deduplicates first offer notification', () => {
    expect(milestones).toContain('existing');
  });

  it('handles both app_created and status_changed events', () => {
    expect(milestones).toContain('app_created');
    expect(milestones).toContain('status_changed');
  });
});

describe('Application routes milestone integration', () => {
  const appRoute = readFileSync(
    resolve(ROOT, 'src/app/api/applications/route.ts'),
    'utf-8',
  );
  const statusRoute = readFileSync(
    resolve(ROOT, 'src/app/api/applications/[applicationId]/status/route.ts'),
    'utf-8',
  );

  it('calls detectMilestones on app creation', () => {
    expect(appRoute).toContain('detectMilestones');
    expect(appRoute).toContain('app_created');
  });

  it('calls detectMilestones on status change', () => {
    expect(statusRoute).toContain('detectMilestones');
    expect(statusRoute).toContain('status_changed');
  });
});
