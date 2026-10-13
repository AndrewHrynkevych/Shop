import { test, expect } from '@playwright/test';
import { SignInPage } from '../../../src/pages/signIn';

test.describe('SignInNegative', () => {
  let signInPage;
  test.beforeEach(async ({ page }) => {
    signInPage = new SignInPage(page);
    await signInPage.open();
  });

  test('show validation on login when email was empty', async ({ page }) => {
    await signInPage.enterPassword('Password123');
    await signInPage.clickSubmitButton();

    await expect(page.getByTestId('error-email')).toHaveText('Введіть email');
    await expect(page).toHaveURL('/login');
  });

  test('show validation on login when password was empty', async ({ page }) => {
    await signInPage.enterEmail('user@shop.test');
    await signInPage.clickSubmitButton();

    await expect(page.getByTestId('error-password')).toHaveText('Введіть пароль');
    await expect(page).toHaveURL('/login');
  });

  test('show validation on login when password was wrong', async ({ page }) => {
    await signInPage.enterEmail('user@shop.test');
    await signInPage.enterPassword('Password1234');
    await signInPage.clickSubmitButton();

    await expect(page.getByTestId('login-error')).toHaveText('Невірний email або пароль');
    await expect(page).toHaveURL('/login');
  });

  test('show validation on login when user is blocked', async ({ page }) => {
    await signInPage.enterEmail('locked@shop.test');
    await signInPage.enterPassword('Password123');
    await signInPage.clickSubmitButton();

    await expect(page.getByTestId('login-error')).toHaveText('Обліковий запис заблоковано. Зверніться до служби підтримки.');
    await expect(page).toHaveURL('/login');
  });
});
