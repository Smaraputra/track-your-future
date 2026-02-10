import { test as setup } from '@playwright/test';

import { closeDb, createTestUser, deleteTestUsers } from './fixtures/db';

const TEST_PASSWORD = 'TestPassword123!';

setup('create test users and authenticate', async ({ page }) => {
  // Clean up any previous test users
  await deleteTestUsers();

  // Create main test user (onboarding completed)
  await createTestUser({
    email: 'e2e-test@tyf.test',
    password: TEST_PASSWORD,
    name: 'E2E Test User',
    onboardingCompleted: true,
  });

  // Create fresh user (onboarding not completed)
  await createTestUser({
    email: 'e2e-new@tyf.test',
    password: TEST_PASSWORD,
    name: 'E2E New User',
    onboardingCompleted: false,
  });

  // Skip boot animation for all auth flows
  await page.addInitScript(() => {
    localStorage.setItem('tyf-boot-seen', 'true');
  });

  // Login main user and save storage state
  await page.goto('/login');
  await page.getByPlaceholder('user@example.com').fill('e2e-test@tyf.test');
  await page.getByPlaceholder('Enter password').fill(TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL('/dashboard', { timeout: 15000 });
  await page.context().storageState({ path: 'tests/e2e/.auth/user.json' });

  // Login fresh user in a new context and save its storage state
  const freshContext = await page.context().browser()!.newContext();
  const freshPage = await freshContext.newPage();
  await freshPage.addInitScript(() => {
    localStorage.setItem('tyf-boot-seen', 'true');
  });
  await freshPage.goto('/login');
  await freshPage.getByPlaceholder('user@example.com').fill('e2e-new@tyf.test');
  await freshPage.getByPlaceholder('Enter password').fill(TEST_PASSWORD);
  await freshPage.getByRole('button', { name: 'Login' }).click();
  // Fresh user redirects to /onboarding (or /dashboard then /onboarding)
  await freshPage.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 });
  await freshContext.storageState({ path: 'tests/e2e/.auth/new-user.json' });
  await freshContext.close();

  await closeDb();
});
