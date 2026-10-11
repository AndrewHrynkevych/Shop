import { test, expect } from '@playwright/test';

test.describe('SignInNegative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('show validation on login when email was empty', async ({ page }) => {
    await page.getByTestId('input-email').fill('');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('error-email')).toHaveText('Введіть email');
    await expect(page).toHaveURL('/login');
  });
  test('show validation on login when password was empty', async ({ page }) => {
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('error-password')).toHaveText('Введіть пароль');
    await expect(page).toHaveURL('/login');

  });
  test('show validation on login when password was wrong', async ({ page }) => {
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password1234');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toHaveText('Невірний email або пароль');
    await expect(page).toHaveURL('/login');
  });
  test('show validation on login when user is blocked', async({page}) => {
    await page.getByTestId('input-email').fill('locked@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toHaveText('Обліковий запис заблоковано. Зверніться до служби підтримки.');
    await expect(page).toHaveURL('/login');
  });
});