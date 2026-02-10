import { expect, test } from '@playwright/test';
import { eq } from 'drizzle-orm';

import { users } from '../../src/db/schema';
import {
  closeDb,
  createTestRole,
  deleteTestApplications,
  deleteTestRoles,
  getDb,
} from './fixtures/db';

let userId: string;

test.beforeAll(async () => {
  const db = getDb();
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'e2e-test@tyf.test'));
  userId = user.id;

  // Create a role for application tests
  await createTestRole(userId, 'E2E App Role');
});

test.afterAll(async () => {
  if (userId) {
    await deleteTestApplications(userId);
    await deleteTestRoles(userId);
  }
  await closeDb();
});

test.describe('Applications CRUD', () => {
  test('create an application', async ({ page }) => {
    await page.goto('/applications/new');
    await expect(
      page.getByRole('heading', { name: 'New Application' }),
    ).toBeVisible();

    await page.getByPlaceholder('e.g. Acme Corp').fill('E2E Test Company');
    await page.getByPlaceholder('e.g. Software Engineer').fill('E2E Test Job');

    // Select role category
    await page.getByLabel('Role Category').click();
    await page.getByRole('option', { name: 'E2E App Role' }).click();

    await page.getByRole('button', { name: 'Create Application' }).click();

    // Should redirect to applications list
    await page.waitForURL('/applications', { timeout: 10000 });
    await expect(page.getByText('E2E Test Company')).toBeVisible();
  });

  test('application appears in list', async ({ page }) => {
    await page.goto('/applications');
    await expect(page.getByText('E2E Test Company')).toBeVisible();
    await expect(page.getByText('E2E Test Job')).toBeVisible();
  });

  test('view application detail page', async ({ page }) => {
    await page.goto('/applications');
    await page.getByRole('link', { name: 'E2E Test Company' }).click();
    await page.waitForURL(/\/applications\//, { timeout: 10000 });

    await expect(
      page.getByRole('heading', { name: 'E2E Test Company' }),
    ).toBeVisible();
    await expect(page.getByText('E2E Test Job')).toBeVisible();
  });

  test('edit an application', async ({ page }) => {
    await page.goto('/applications');
    await page.getByRole('button', { name: 'Edit E2E Test Company' }).click();
    await page.waitForURL(/\/applications\/.*\/edit/, { timeout: 10000 });

    const companyInput = page.getByPlaceholder('e.g. Acme Corp');
    await companyInput.clear();
    await companyInput.fill('E2E Updated Company');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await page.waitForURL('/applications', { timeout: 10000 });
    await expect(page.getByText('E2E Updated Company')).toBeVisible();
  });

  test('delete an application', async ({ page }) => {
    await page.goto('/applications');
    await page
      .getByRole('button', { name: 'Delete E2E Updated Company' })
      .click();

    // Confirm delete
    await expect(
      page.getByRole('heading', { name: 'Delete Application' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // Application should be gone
    await expect(page.getByText('E2E Updated Company')).not.toBeVisible();
  });
});
