import { test, expect } from '@playwright/test';
import { SignInPage } from '../../../src/pages/signIn';
import { PasswordResetPage } from '../../../src/pages/passwordReset';

test.describe('Password reset', () => {
  let signInPage;
  let passwordResetPage;
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/test/reset');
    signInPage = new SignInPage(page);
    passwordResetPage = new PasswordResetPage(page);
    await signInPage.open();
  });

  test('does not send reset email for unregistered user', async ({ page }) => {
    await signInPage.clickForgotPasswordLink();
    await passwordResetPage.enterEmail('user@shop.test1');
    await passwordResetPage.clickSendButton();

    await passwordResetPage.openMailbox();
    await expect(page.getByTestId('mailbox-empty')).toContainText('Листів поки немає.');
  });

  test('show validation error when reset email with empty email', async ({ page }) => {
    await signInPage.clickForgotPasswordLink();
    await passwordResetPage.clickSendButton();

    await expect(page).toHaveURL('/forgot-password');
    await expect(page.getByTestId('error-email')).toContainText('Введіть email');
  });
});
