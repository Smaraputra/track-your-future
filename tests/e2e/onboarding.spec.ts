import { expect, test } from '@playwright/test';

test.describe('Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('tyf-boot-seen', 'true');
    });
  });

  test('fresh user is redirected to onboarding', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForURL('/onboarding', { timeout: 15000 });
    await expect(page).toHaveURL('/onboarding');
  });

  test('complete all 4 steps of onboarding wizard', async ({ page }) => {
    await page.goto('/onboarding');

    // Step 1: Name
    await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    const nameInput = page.getByPlaceholder('Your name');
    await nameInput.clear();
    await nameInput.fill('E2E Onboarded User');
    await page.getByRole('button', { name: 'Next' }).click();

    // Step 2: Role -- skip it
    await expect(
      page.getByRole('heading', { name: 'First Role' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();

    // Step 3: CV Upload -- skip it
    await expect(
      page.getByRole('heading', { name: 'Upload CV' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Skip' }).click();

    // Step 4: Summary
    await expect(
      page.getByRole('heading', { name: 'Ready to Launch' }),
    ).toBeVisible();
    await expect(page.getByText('E2E Onboarded User')).toBeVisible();
    await page.getByRole('button', { name: 'Initialize Dashboard' }).click();

    // Should land on dashboard after completion
    await page.waitForURL('/dashboard', { timeout: 15000 });
    await expect(page).toHaveURL('/dashboard');
  });
});
