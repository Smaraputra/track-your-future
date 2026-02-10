import { expect, test } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('stat cards render', async ({ page }) => {
    await expect(page.getByText('Total Applications')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
    await expect(page.getByText('Interviews')).toBeVisible();
    await expect(page.getByText('Offers')).toBeVisible();
  });

  test('quick links section visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible();
  });

  test('activity feed section visible', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /Recent Activity/ }),
    ).toBeVisible();
  });

  test('sidebar navigation is present', async ({ page }) => {
    // Desktop sidebar
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Applications' }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Roles' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Documents' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  });
});
