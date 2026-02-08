import { expect, test } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with expected title', async ({ page }) => {
    await expect(page).toHaveTitle(/Create Next App/);
  });

  test('Next.js logo is visible', async ({ page }) => {
    const logo = page.getByAltText('Next.js logo');
    await expect(logo).toBeVisible();
  });

  test('documentation link is present with valid href', async ({ page }) => {
    const docsLink = page.getByRole('link', { name: /documentation/i });
    await expect(docsLink).toBeVisible();
    await expect(docsLink).toHaveAttribute('href', /nextjs\.org\/docs/);
  });

  test('deploy link is present with valid href', async ({ page }) => {
    const deployLink = page.getByRole('link', { name: /deploy now/i });
    await expect(deployLink).toBeVisible();
    await expect(deployLink).toHaveAttribute('href', /vercel\.com/);
  });

  test('renders correctly at mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const logo = page.getByAltText('Next.js logo');
    await expect(logo).toBeVisible();
  });

  test('renders correctly at desktop viewport (1920px)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const logo = page.getByAltText('Next.js logo');
    await expect(logo).toBeVisible();
  });
});
