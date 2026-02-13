import { expect, test } from '@playwright/test';

test.describe('Legal Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tyf-boot-seen', 'true');
    });
  });

  test('privacy page renders with heading and window title', async ({ page }) => {
    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', { name: 'Privacy Policy' }),
    ).toBeVisible();
    await expect(page.getByText('sys://privacy-policy')).toBeVisible();
  });

  test('privacy page has required GDPR sections', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText('Data We Collect')).toBeVisible();
    await expect(page.getByText('Your Rights (GDPR)')).toBeVisible();
    await expect(page.getByText('Data Retention')).toBeVisible();
  });

  test('terms page renders with heading and window title', async ({ page }) => {
    await page.goto('/terms');
    await expect(
      page.getByRole('heading', { name: 'Terms of Service' }),
    ).toBeVisible();
    await expect(page.getByText('sys://terms-of-service')).toBeVisible();
  });

  test('terms page has required sections', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: /Acceptance of Terms/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Subscription and Billing/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Limitation of Liability/ })).toBeVisible();
  });
});
