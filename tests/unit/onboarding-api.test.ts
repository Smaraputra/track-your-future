import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Onboarding API routes', () => {
  describe('POST /api/settings/onboarding-complete', () => {
    const route = readFileSync(
      resolve(ROOT, 'src/app/api/settings/onboarding-complete/route.ts'),
      'utf-8',
    );

    it('exports POST handler', () => {
      expect(route).toContain('export async function POST');
    });

    it('checks authentication', () => {
      expect(route).toContain('auth()');
      expect(route).toContain('Unauthorized');
    });

    it('sets onboardingCompleted to true', () => {
      expect(route).toContain('onboardingCompleted: true');
    });

    it('scopes update by userId', () => {
      expect(route).toContain('session.user.id');
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
});

describe('Onboarding schema', () => {
  const schema = readFileSync(
    resolve(ROOT, 'src/db/schema/auth.ts'),
    'utf-8',
  );

  it('has onboardingCompleted column', () => {
    expect(schema).toContain('onboarding_completed');
  });

  it('defaults to false', () => {
    expect(schema).toContain('.default(false)');
  });
});

describe('Dashboard layout onboarding guard', () => {
  const layout = readFileSync(
    resolve(ROOT, 'src/app/(dashboard)/layout.tsx'),
    'utf-8',
  );

  it('imports OnboardingGuard', () => {
    expect(layout).toContain('OnboardingGuard');
  });

  it('checks onboardingCompleted flag', () => {
    expect(layout).toContain('onboardingCompleted');
  });

  it('wraps children with OnboardingGuard', () => {
    expect(layout).toContain('<OnboardingGuard');
  });
});
