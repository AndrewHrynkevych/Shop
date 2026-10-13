import { test, expect } from '@playwright/test';
import { SignInPage } from '../../../src/pages/signIn';

test.describe('SignInPositive', () => {
  test.beforeEach(async ({ page }) => {
    await new SignInPage(page).open();
  });

  test('log in with valid credentials', async ({ page }) => {
    const signInPage = new SignInPage(page);

    await signInPage.login('user@shop.test', 'Password123');
    await expect(page).toHaveURL('/account');
    await expect(page.getByTestId('page-title')).toHaveText('Особистий кабінет');
  });
});
