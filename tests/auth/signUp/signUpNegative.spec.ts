import { test, expect } from '@playwright/test';

test.describe('SignUpNegative', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('show validation for empty register fields', async ({ page }) => {
    await page.getByTestId('input-terms').check();
    await page.getByTestId('register-submit').click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('error-name')).toContainText("Ім'я має містити щонайменше 2 символи");
    await expect(page.getByTestId('error-email')).toContainText('Вкажіть коректний email');
    await expect(page.getByTestId('error-password')).toContainText('Пароль: мінімум 8 символів, літери та цифри');
  });

  test('show error when email has already registered', async ({ page }) => {
    await page.getByTestId('input-name').fill('Test User');
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('input-confirmPassword').fill('Password123');
    await page.getByTestId('input-terms').check();
    await page.getByTestId('register-submit').click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('error-email')).toHaveText('Користувач з таким email вже існує');
  });

  test('show reject invalid email format', async ({ page }) => {
    await page.getByTestId('input-name').fill('Test User');
    await page.getByTestId('input-email').fill('newuser');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('input-confirmPassword').fill('Password123');
    await page.getByTestId('input-terms').check();
    await page.getByTestId('register-submit').click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('error-email')).toHaveText('Вкажіть коректний email');
  });

  test('show validation error when email doesn`t meet requirements', async ({ page }) => {
    // домен після крапки має містити щонайменше 2 символи
    await page.getByTestId('input-name').fill('Test User');
    await page.getByTestId('input-email').fill('newuser@shop.t');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('input-confirmPassword').fill('Password123');
    await page.getByTestId('input-terms').check();
    await page.getByTestId('register-submit').click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('error-email')).toHaveText('Вкажіть коректний email');
  });

  test('show validation error when name has less than 2 symbols', async ({ page }) => {
    await page.getByTestId('input-name').fill('T');
    await page.getByTestId('input-email').fill('newuser@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('input-confirmPassword').fill('Password123');
    await page.getByTestId('input-terms').check();
    await page.getByTestId('register-submit').click();
    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('error-name')).toHaveText("Ім'я має містити щонайменше 2 символи");
  });
});
