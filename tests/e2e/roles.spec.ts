import { expect, test } from '@playwright/test';

import { closeDb, deleteTestRoles, getDb } from './fixtures/db';
import { users } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

let userId: string;

test.beforeAll(async () => {
  const db = getDb();
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, 'e2e-test@tyf.test'));
  userId = user.id;
});

test.afterAll(async () => {
  if (userId) {
    await deleteTestRoles(userId);
  }
  await closeDb();
});

test.describe('Role Categories CRUD', () => {
  test('create a role category', async ({ page }) => {
    await page.goto('/roles/new');
    await expect(
      page.getByRole('heading', { name: 'New Role Category' }),
    ).toBeVisible();

    await page.getByPlaceholder('e.g. Frontend Developer').fill('E2E Test Role');
    await page
      .getByPlaceholder('Optional description for this role category')
      .fill('Created by E2E test');
    await page.getByRole('button', { name: 'Create Role' }).click();

    // Should redirect to roles list
    await page.waitForURL('/roles', { timeout: 10000 });
    await expect(page.getByText('E2E Test Role')).toBeVisible();
  });

  test('role appears in list', async ({ page }) => {
    await page.goto('/roles');
    await expect(page.getByText('E2E Test Role')).toBeVisible();
  });

  test('edit a role name', async ({ page }) => {
    await page.goto('/roles');
    await page.getByRole('button', { name: 'Edit E2E Test Role' }).click();
    await page.waitForURL(/\/roles\/.*\/edit/, { timeout: 10000 });

    const nameInput = page.getByPlaceholder('e.g. Frontend Developer');
    await nameInput.clear();
    await nameInput.fill('E2E Updated Role');
    await page.getByRole('button', { name: 'Save Changes' }).click();

    await page.waitForURL('/roles', { timeout: 10000 });
    await expect(page.getByText('E2E Updated Role')).toBeVisible();
  });

  test('delete a role', async ({ page }) => {
    await page.goto('/roles');
    await page.getByRole('button', { name: 'Delete E2E Updated Role' }).click();

    // Confirm in delete dialog
    await expect(
      page.getByRole('heading', { name: 'Delete Role Category' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // Role should be gone
    await expect(page.getByText('E2E Updated Role')).not.toBeVisible();
  });
});
