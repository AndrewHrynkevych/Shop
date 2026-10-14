import { test, expect } from '@playwright/test';
import { SignInPage } from '../../../src/pages/signIn';
import { AccountPage } from '../../../src/pages/account';

test.describe('SignInPositive', () => {
  test.beforeEach(async ({ page }) => {
    await new SignInPage(page).open();
  });

  test('log in with valid credentials', async ({ page }) => {
    const signInPage = new SignInPage(page);
    const accountPage = new AccountPage(page);

    await signInPage.login('user@shop.test', 'Password123');

    await accountPage.assertToHaveAccount();
    await accountPage.assertTextMessage();
  });
});
