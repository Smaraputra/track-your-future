import { expect, test } from '@playwright/test';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tyf-boot-seen', 'true');
    });
    await page.goto('/pricing');
  });

  test('renders pricing heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Pricing' }),
    ).toBeVisible();
  });

  test('shows Free and Pro tiers', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible();
  });

  test('shows free tier price', async ({ page }) => {
    await expect(page.getByText('$0')).toBeVisible();
  });

  test('shows interval toggle', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Monthly' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Annual' })).toBeVisible();
  });

  test('shows feature comparison table', async ({ page }) => {
    await expect(page.getByText('Applications')).toBeVisible();
    await expect(page.getByText('Documents')).toBeVisible();
    await expect(page.getByText('Storage')).toBeVisible();
  });
});
