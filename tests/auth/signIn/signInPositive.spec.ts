import { test, expect } from '@playwright/test';

test.describe('SignInPositive', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('log in with valid credentials', async ({ page }) => {
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/account');
    await expect(page.getByTestId('page-title')).toHaveText('Особистий кабінет');
  });
});