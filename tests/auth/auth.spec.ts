import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('should log in with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/account');
    await expect(page.getByTestId('page-title')).toHaveText('Особистий кабінет');
  });

  test('show validation on login when email was empty', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('input-email').fill('');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('error-email')).toContainText('Введіть email');

  });
  test('show validation on login when password was empty', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('error-password')).toContainText('Введіть пароль');

  });
  test('show validation on login when email was wrong', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('input-email').fill('user1@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toContainText('Невірний email або пароль');
  });
  test('show validation on login when password was wrong', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password1234');
    await page.getByTestId('login-submit').click();
    await expect(page.getByTestId('login-error')).toContainText('Невірний email або пароль');
  });
});

/*
test.describe('Authorization', () => {
  //test('show validation for empty register fields');
  //test('show error when email has already registered');
  //test('show reject invalid email format');
  //test('show validation error when email doesn`t meet requirements');
  //test('show validation error when name has less than 2 symbols');


test.describe('Password reset', () => {
  //test('should send reset email for registered user', ...);
  //test('should set new password via reset link', ...);
});

test.describe('Profile', () => {
  //test('should update personal info');
  //test('should able to check purchases');
});
*/