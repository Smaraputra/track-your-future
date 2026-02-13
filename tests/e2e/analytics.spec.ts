import { expect, test } from '@playwright/test';

test.describe('Analytics Page', () => {
  test('renders with sys://analytics window title', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.getByText('sys://analytics')).toBeVisible();
  });

  test('shows empty state or chart sections', async ({ page }) => {
    await page.goto('/analytics');
    // Depending on whether the test user has data, either:
    // - "No data to display" empty state, or
    // - "Status Distribution" chart heading
    const emptyState = page.getByText('No data to display');
    const chartHeading = page.getByText('Status Distribution');
    await expect(emptyState.or(chartHeading)).toBeVisible();
  });

  test('dock navigation link to analytics is present', async ({ page }) => {
    await page.goto('/analytics');
    const dock = page.getByTestId('dock');
    await expect(dock).toBeVisible();
    await expect(dock.locator('a[href="/analytics"]')).toBeVisible();
  });
});
