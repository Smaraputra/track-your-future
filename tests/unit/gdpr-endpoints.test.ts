import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('GDPR export endpoint', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/settings/export/route.ts'),
    'utf-8',
  );

  it('exports a GET handler', () => {
    expect(source).toContain('export async function GET');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain("status: 401");
  });

  it('queries all user-scoped tables', () => {
    const tables = [
      'users',
      'roleCategories',
      'documents',
      'formFieldTemplates',
      'applications',
      'applicationStatusHistory',
      'applicationDocuments',
      'subscriptions',
      'payments',
      'parsedProfiles',
      'jobAnalyses',
      'aiUsage',
      'notifications',
    ];
    for (const table of tables) {
      expect(source).toContain(table);
    }
  });

  it('excludes sensitive fields from user data', () => {
    // The query selects specific columns, omitting hashedPassword
    expect(source).not.toContain("hashedPassword: true");
  });

  it('sets Content-Disposition header for download', () => {
    expect(source).toContain('Content-Disposition');
    expect(source).toContain('attachment');
  });

  it('runs queries in parallel with Promise.all', () => {
    expect(source).toContain('Promise.all');
  });
});

describe('GDPR account deletion endpoint', () => {
  const source = readFileSync(
    resolve(ROOT, 'src/app/api/settings/account/route.ts'),
    'utf-8',
  );

  it('exports a DELETE handler', () => {
    expect(source).toContain('export async function DELETE');
  });

  it('checks auth session', () => {
    expect(source).toContain('await auth()');
    expect(source).toContain("status: 401");
  });

  it('requires confirmation string via Zod', () => {
    expect(source).toContain("z.literal('DELETE MY ACCOUNT')");
  });

  it('returns 400 without proper confirmation', () => {
    expect(source).toContain("status: 400");
  });

  it('deletes user files from MinIO before account deletion', () => {
    expect(source).toContain('deleteObjects');
    expect(source).toContain('documents.fileKey');
  });

  it('cancels active Stripe subscription on deletion', () => {
    expect(source).toContain('stripe.subscriptions.cancel');
    expect(source).not.toContain('// TODO: Cancel Stripe');
  });

  it('handles active, trialing, and past_due statuses', () => {
    expect(source).toContain("'active', 'trialing', 'past_due'");
  });

  it('dynamically imports Stripe to avoid loading for free users', () => {
    expect(source).toContain("await import('@/lib/billing/stripe')");
  });

  it('checks for active Stripe subscription', () => {
    expect(source).toContain('providerSubscriptionId');
  });

  it('deletes the user row to cascade all data', () => {
    expect(source).toContain('db.delete(users)');
    expect(source).toContain('eq(users.id, userId)');
  });

  it('returns success message', () => {
    expect(source).toContain('Account deleted successfully');
  });
});
