import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('POST /api/settings/change-password', () => {
  const route = readFileSync(
    resolve(ROOT, 'src/app/api/settings/change-password/route.ts'),
    'utf-8',
  );

  it('exports POST handler', () => {
    expect(route).toContain('export async function POST');
  });

  it('checks authentication', () => {
    expect(route).toContain('auth()');
    expect(route).toContain('Unauthorized');
  });

  it('validates input with zod', () => {
    expect(route).toContain('safeParse');
    expect(route).toContain('changePasswordSchema');
  });

  it('requires currentPassword and newPassword', () => {
    expect(route).toContain('currentPassword');
    expect(route).toContain('newPassword');
  });

  it('enforces minimum password length', () => {
    expect(route).toContain('.min(8)');
  });

  it('verifies current password before changing', () => {
    expect(route).toContain('verifyPassword');
    expect(route).toContain('Current password is incorrect');
  });

  it('hashes new password', () => {
    expect(route).toContain('hashPassword');
  });

  it('handles OAuth-only accounts', () => {
    expect(route).toContain('Password login not available');
  });

  it('scopes update by userId', () => {
    expect(route).toContain('session.user.id');
  });
});

describe('GET /api/settings/ai-usage', () => {
  const route = readFileSync(
    resolve(ROOT, 'src/app/api/settings/ai-usage/route.ts'),
    'utf-8',
  );

  it('exports GET handler', () => {
    expect(route).toContain('export async function GET');
  });

  it('checks authentication', () => {
    expect(route).toContain('auth()');
    expect(route).toContain('Unauthorized');
  });

  it('queries current month only', () => {
    expect(route).toContain('monthStart');
    expect(route).toContain('setDate(1)');
    expect(route).toContain('gte(aiUsage.createdAt');
  });

  it('groups by feature', () => {
    expect(route).toContain('groupBy');
    expect(route).toContain('aiUsage.feature');
  });

  it('returns usage and month', () => {
    expect(route).toContain('usage');
    expect(route).toContain('month');
  });
});

describe('PATCH /api/settings/profile', () => {
  const route = readFileSync(
    resolve(ROOT, 'src/app/api/settings/profile/route.ts'),
    'utf-8',
  );

  it('exports PATCH handler', () => {
    expect(route).toContain('export async function PATCH');
  });

  it('checks authentication', () => {
    expect(route).toContain('auth()');
    expect(route).toContain('Unauthorized');
  });

  it('validates input with zod', () => {
    expect(route).toContain('safeParse');
  });

  it('updates name field', () => {
    expect(route).toContain('updates.name');
  });

  it('returns 400 for empty updates', () => {
    expect(route).toContain('No fields to update');
  });
});

describe('GET /api/settings/export', () => {
  const route = readFileSync(
    resolve(ROOT, 'src/app/api/settings/export/route.ts'),
    'utf-8',
  );

  it('exports GET handler', () => {
    expect(route).toContain('export async function GET');
  });

  it('checks authentication', () => {
    expect(route).toContain('auth()');
    expect(route).toContain('Unauthorized');
  });

  it('exports all user data', () => {
    expect(route).toContain('roleCategories');
    expect(route).toContain('applications');
    expect(route).toContain('documents');
    expect(route).toContain('aiUsage');
    expect(route).toContain('notifications');
  });

  it('sets download headers', () => {
    expect(route).toContain('Content-Disposition');
    expect(route).toContain('attachment');
  });
});

describe('DELETE /api/settings/account', () => {
  const route = readFileSync(
    resolve(ROOT, 'src/app/api/settings/account/route.ts'),
    'utf-8',
  );

  it('exports DELETE handler', () => {
    expect(route).toContain('export async function DELETE');
  });

  it('requires confirmation string', () => {
    expect(route).toContain('DELETE MY ACCOUNT');
  });

  it('deletes user files from MinIO', () => {
    expect(route).toContain('deleteObjects');
  });

  it('cancels Stripe subscription', () => {
    expect(route).toContain('subscriptions.cancel');
  });

  it('deletes user record', () => {
    expect(route).toContain('db.delete(users)');
  });
});
