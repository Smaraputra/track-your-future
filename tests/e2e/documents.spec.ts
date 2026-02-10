import { expect, test } from '@playwright/test';

test.describe('Documents Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/documents');
  });

  test('documents page renders with window title', async ({ page }) => {
    await expect(page.getByText('sys://documents')).toBeVisible();
  });

  test('upload button is visible', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: 'Upload', exact: true }),
    ).toBeVisible();
  });

  test('empty state or document list shown', async ({ page }) => {
    // Either empty state or document count is visible
    const hasEmptyState = await page.getByText('No Documents Yet').isVisible().catch(() => false);
    const hasDocCount = await page.getByText(/\d+ documents?/).isVisible().catch(() => false);
    expect(hasEmptyState || hasDocCount).toBe(true);
  });

  test('filter dropdowns are visible', async ({ page }) => {
    await expect(page.getByText('All Types')).toBeVisible();
    await expect(page.getByText('All Roles')).toBeVisible();
  });
});
