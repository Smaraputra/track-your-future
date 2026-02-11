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

  test('dock navigation is present', async ({ page }) => {
    const dock = page.getByTestId('dock');
    await expect(dock.getByRole('link', { name: 'Dashboard' })).toBeVisible();
    await expect(dock.getByRole('link', { name: 'Applications' })).toBeVisible();
    await expect(dock.getByRole('link', { name: 'Roles' })).toBeVisible();
    await expect(dock.getByRole('link', { name: 'Documents' })).toBeVisible();
    await expect(dock.getByRole('link', { name: 'Settings' })).toBeVisible();
  });
});
