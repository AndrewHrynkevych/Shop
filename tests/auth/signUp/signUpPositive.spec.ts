import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/test/reset');
  await page.goto('/register');
});

test('sign up with valid credential',  async ({ page }) => {
  await page.getByTestId('input-name').fill('Te');
  await page.getByTestId('input-email').fill('pei@example.com');
  await page.getByTestId('input-password').fill('Password123');
  await page.getByTestId('input-confirmPassword').fill('Password123');
  await page.getByTestId('input-terms').check();
  await page.getByTestId('register-submit').click();
  await expect(page.getByTestId('flash-message')).toContainText('Реєстрація успішна! Ласкаво просимо.');
  await expect(page).toHaveURL('/account');
});