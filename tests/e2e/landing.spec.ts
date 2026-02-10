import { expect, test } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Skip boot animation
    await page.addInitScript(() => {
      localStorage.setItem('tyf-boot-seen', 'true');
    });
    await page.goto('/');
  });

  test('displays hero section with heading and CTA', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Track Your Future' }),
    ).toBeVisible();
    await expect(
      page.getByText('Your job search command center.').first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Initialize System' }),
    ).toBeVisible();
  });

  test('"Initialize System" links to register', async ({ page }) => {
    const cta = page.getByRole('link', { name: 'Initialize System' });
    await expect(cta).toHaveAttribute('href', '/register');
  });

  test('feature cards are visible', async ({ page }) => {
    await expect(page.getByText('System Capabilities')).toBeVisible();
    await expect(page.getByText('Application Tracker')).toBeVisible();
    await expect(page.getByText('Document Manager')).toBeVisible();
    await expect(page.getByText('AI Analysis Engine')).toBeVisible();
  });

  test('footer links are present', async ({ page }) => {
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'Privacy Policy' }),
    ).toBeVisible();
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'Terms of Service' }),
    ).toBeVisible();
  });

  test('renders correctly at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.getByRole('heading', { name: 'Track Your Future' }),
    ).toBeVisible();
  });

  test('renders correctly at desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(
      page.getByRole('heading', { name: 'Track Your Future' }),
    ).toBeVisible();
  });

  test('boot animation shows on first visit', async ({ browser }) => {
    // Create a fresh context without localStorage skip
    const freshContext = await browser.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:3001',
    });
    const freshPage = await freshContext.newPage();
    await freshPage.goto('/');
    await expect(freshPage.locator('[data-testid="boot-sequence"]')).toBeVisible();
    await freshContext.close();
  });
});
