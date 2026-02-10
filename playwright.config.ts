import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: /(onboarding|auth|landing|pricing)\.spec\.ts/,
    },
    {
      name: 'fresh-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'tests/e2e/.auth/new-user.json',
      },
      dependencies: ['setup'],
      testMatch: /onboarding\.spec\.ts/,
    },
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /(landing|pricing|auth)\.spec\.ts/,
    },
  ],
  webServer: {
    command: 'PORT=3001 NEXTAUTH_URL=http://localhost:3001 pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
