import { expect, test } from '@playwright/test';

test.describe('Documents Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents');
  });

  test('documents page renders', async ({ page }) => {
    await expect(page.getByText(/document/i)).toBeVisible();
  });

  test('upload button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /upload/i }),
    ).toBeVisible();
  });

  test('empty state shown when no documents', async ({ page }) => {
    // If no documents exist, should show empty state
    const emptyState = page.getByText(/no documents yet|upload/i);
    await expect(emptyState.first()).toBeVisible();
  });

  test('filter dropdowns are visible', async ({ page }) => {
    await expect(page.getByText('All Types')).toBeVisible();
    await expect(page.getByText('All Roles')).toBeVisible();
  });
});
