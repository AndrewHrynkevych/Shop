import { test, expect } from '@playwright/test';
import { SignInPage } from '../../../src/pages/signIn';
import { AccountPage } from '../../../src/pages/account';

test.describe('Profile', () => {
  let signInPage;
  let accountPage;
  test.beforeEach(async ({ page }) => {
    signInPage = new SignInPage(page);
    accountPage = new AccountPage(page);
    await signInPage.open();
  });

  test('able to update personal info', async ({ page }) => {
    await signInPage.enterEmail('user@shop.test');
    await signInPage.enterPassword('Password123');
    await signInPage.clickSubmitButton();
    await expect(page).toHaveURL('/account');

    await accountPage.enterName('Updated Customer');
    await expect(page.getByTestId('profile-email')).toBeDisabled();
    await accountPage.enterPhone('+380507802347');
    await accountPage.clickSaveButton();

    await expect(page.getByTestId('flash-message')).toBeVisible();
    await expect(page.getByTestId('input-name')).toHaveValue('Updated Customer');
    await expect(page.getByTestId('input-phone')).toHaveValue('+380507802347');
  });

  test('able to check purchases', async ({ page }) => {
    await signInPage.enterEmail('user@shop.test');
    await signInPage.enterPassword('Password123');
    await signInPage.clickSubmitButton();

    await accountPage.clickOrdersTab();
    await expect(page).toHaveURL('/account/orders');
  });
});
