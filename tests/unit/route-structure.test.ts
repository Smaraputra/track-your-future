import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '../..');

describe('Route structure', () => {
  const publicPages = [
    'src/app/(public)/page.tsx',
    'src/app/(public)/layout.tsx',
    'src/app/(public)/login/page.tsx',
    'src/app/(public)/register/page.tsx',
    'src/app/(public)/privacy/page.tsx',
    'src/app/(public)/terms/page.tsx',
    'src/app/(public)/verify-email/page.tsx',
    'src/app/(public)/reset-password/page.tsx',
    'src/app/(public)/reset-password/confirm/page.tsx',
    'src/app/(public)/pricing/page.tsx',
  ];

  const dashboardPages = [
    'src/app/(dashboard)/layout.tsx',
    'src/app/(dashboard)/dashboard/page.tsx',
    'src/app/(dashboard)/applications/page.tsx',
    'src/app/(dashboard)/applications/new/page.tsx',
    'src/app/(dashboard)/applications/[applicationId]/page.tsx',
    'src/app/(dashboard)/applications/[applicationId]/edit/page.tsx',
    'src/app/(dashboard)/roles/page.tsx',
    'src/app/(dashboard)/roles/new/page.tsx',
    'src/app/(dashboard)/roles/[roleId]/page.tsx',
    'src/app/(dashboard)/roles/[roleId]/edit/page.tsx',
    'src/app/(dashboard)/documents/page.tsx',
    'src/app/(dashboard)/templates/page.tsx',
    'src/app/(dashboard)/analytics/page.tsx',
    'src/app/(dashboard)/settings/page.tsx',
  ];

  it.each(publicPages)('public page exists: %s', (path) => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
  });

  it.each(dashboardPages)('dashboard page exists: %s', (path) => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
  });

  const onboardingPages = [
    'src/app/(onboarding)/layout.tsx',
    'src/app/(onboarding)/onboarding/page.tsx',
  ];

  const infrastructureRoutes = [
    'src/app/(dashboard)/template.tsx',
    'src/app/api/health/route.ts',
    'src/app/api/cron/detect-stale/route.ts',
  ];

  it.each(onboardingPages)('onboarding page exists: %s', (path) => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
  });

  it.each(infrastructureRoutes)('infrastructure route exists: %s', (path) => {
    expect(existsSync(resolve(ROOT, path))).toBe(true);
  });

  it('old root page.tsx is deleted', () => {
    expect(existsSync(resolve(ROOT, 'src/app/page.tsx'))).toBe(false);
  });
});

describe('Auth authorized callback', () => {
  // Test the logic by reading the source and verifying the allowlist approach
  const authSource = readFileSync(
    resolve(ROOT, 'src/auth.ts'),
    'utf-8',
  );

  it('uses public path allowlist instead of dashboard-only check', () => {
    expect(authSource).toContain('publicPaths');
    expect(authSource).not.toContain("startsWith('/dashboard')");
  });

  it('includes all public routes in allowlist', () => {
    const requiredPaths = [
      "'/'",
      "'/login'",
      "'/register'",
      "'/privacy'",
      "'/terms'",
      "'/verify-email'",
      "'/reset-password'",
      "'/pricing'",
    ];
    for (const path of requiredPaths) {
      expect(authSource).toContain(path);
    }
  });

  it('allows api/auth routes through', () => {
    expect(authSource).toContain("/api/auth/'");
  });

  it('blocks unauthenticated access to non-public paths', () => {
    expect(authSource).toContain('!isPublic && !isLoggedIn');
  });
});

describe('Public layout', () => {
  const layoutSource = readFileSync(
    resolve(ROOT, 'src/app/(public)/layout.tsx'),
    'utf-8',
  );

  it('renders a logo link to /', () => {
    expect(layoutSource).toContain('href="/"');
    expect(layoutSource).toContain('TYF://');
  });

  it('has login and register links', () => {
    expect(layoutSource).toContain('href="/login"');
    expect(layoutSource).toContain('href="/register"');
  });
});

describe('Dashboard layout', () => {
  const layoutSource = readFileSync(
    resolve(ROOT, 'src/app/(dashboard)/layout.tsx'),
    'utf-8',
  );

  it('imports auth and redirects to /login', () => {
    expect(layoutSource).toContain("import { auth } from '@/auth'");
    expect(layoutSource).toContain("redirect('/login')");
  });

  it('renders BottomDock and DockStatusBar', () => {
    expect(layoutSource).toContain('<BottomDock');
    expect(layoutSource).toContain('<DockStatusBar');
  });

  it('passes session user data to header', () => {
    expect(layoutSource).toContain('session.user.name');
    expect(layoutSource).toContain('session.user.email');
    expect(layoutSource).toContain('session.user.image');
  });
});
