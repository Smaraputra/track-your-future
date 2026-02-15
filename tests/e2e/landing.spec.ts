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
      page.getByRole('heading', { name: 'Tracked Your Future' }),
    ).toBeVisible();
    await expect(
      page.getByText('Track applications, manage documents, get AI-powered insights.').first(),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Initialize System' }),
    ).toBeVisible();
  });

  test('"Initialize System" links to login', async ({ page }) => {
    const cta = page.getByRole('link', { name: 'Initialize System' });
    await expect(cta).toHaveAttribute('href', '/login');
  });

  test('feature list is visible', async ({ page }) => {
    await expect(page.getByText('Application Tracker').first()).toBeVisible();
    await expect(page.getByText('Document Manager').first()).toBeVisible();
    await expect(page.getByText('AI Analysis Engine').first()).toBeVisible();
  });

  test('hero contains MatrixRain canvas', async ({ page }) => {
    await expect(page.locator('canvas[aria-hidden="true"]').first()).toBeVisible();
  });

  test('capabilities section shows system limits', async ({ page }) => {
    await expect(page.getByText('25').first()).toBeVisible();
    await expect(page.getByText('Applications').first()).toBeVisible();
    await expect(page.getByText('AI Tools').first()).toBeVisible();
  });

  test('footer links are present', async ({ page }) => {
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' }),
    ).toBeVisible();
    await expect(
      page.getByRole('contentinfo').getByRole('link', { name: 'Terms' }),
    ).toBeVisible();
  });

  test('renders correctly at mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.getByRole('heading', { name: 'Tracked Your Future' }),
    ).toBeVisible();
  });

  test('renders correctly at desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(
      page.getByRole('heading', { name: 'Tracked Your Future' }),
    ).toBeVisible();
  });

  test('boot animation shows on first visit', async ({ browser }) => {
    // Create a fresh context without localStorage skip
    const port = process.env.E2E_PORT || '3001';
    const freshContext = await browser.newContext({
      baseURL: process.env.BASE_URL || `http://localhost:${port}`,
    });
    const freshPage = await freshContext.newPage();
    await freshPage.goto('/');
    await expect(freshPage.locator('[data-testid="boot-sequence"]')).toBeVisible();
    await freshContext.close();
  });
});
