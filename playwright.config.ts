import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.E2E_PORT || '3001';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: BASE_URL,
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
      testIgnore: /(onboarding|auth|landing|pricing|legal)\.spec\.ts/,
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
      testMatch: /(landing|pricing|auth|legal)\.spec\.ts/,
    },
  ],
  webServer: {
    command: `PORT=${PORT} NEXTAUTH_URL=${BASE_URL} pnpm dev`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
  },
});
