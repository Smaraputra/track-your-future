import { expect, test } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('all 5 tabs render', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Appearance' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Profile' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Security' })).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Subscription' }),
    ).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Data' })).toBeVisible();
  });

  test('appearance tab is default and shows theme toggle', async ({
    page,
  }) => {
    // Appearance tab should be selected by default
    await expect(page.getByRole('tab', { name: 'Appearance' })).toHaveAttribute(
      'data-state',
      'active',
    );
    // Theme toggle should be visible
    await expect(page.getByText(/theme/i)).toBeVisible();
  });

  test('profile tab shows user name', async ({ page }) => {
    await page.getByRole('tab', { name: 'Profile' }).click();
    // Profile tab should show the test user's name in an input
    await expect(page.locator('input[value="E2E Test User"]')).toBeVisible();
  });
});
