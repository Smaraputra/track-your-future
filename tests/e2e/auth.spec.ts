import { expect, test } from '@playwright/test';

const TEST_PASSWORD = 'TestPassword123!';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tyf-boot-seen', 'true');
    });
  });

  test('login with valid credentials redirects to dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('user@example.com').fill('e2e-test@tyf.test');
    await page.getByPlaceholder('Enter password').fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL('/dashboard');
  });

  test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('user@example.com').fill('e2e-test@tyf.test');
    await page.getByPlaceholder('Enter password').fill('WrongPassword!');
    await page.getByRole('button', { name: 'Login' }).click();
    // NextAuth redirects to /login?error=CredentialsSignin on failure
    await page.waitForURL(/\/login\?error/, { timeout: 15000 });
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('accessing dashboard unauthenticated redirects to login', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('register page renders with form fields', async ({ page }) => {
    await page.goto('/register');
    await expect(
      page.getByRole('heading', { name: 'Register' }),
    ).toBeVisible();
    await expect(page.getByPlaceholder('Your name')).toBeVisible();
    await expect(page.getByPlaceholder('user@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Min. 8 characters')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Register' }),
    ).toBeVisible();
  });

  test('login page renders with form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.getByPlaceholder('user@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Enter password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
  });
});
