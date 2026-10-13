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

  // повертаємо початковий пароль, щоб не зламати тести на вхід в інших файлах
  test.afterEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('send reset email for registered user', async ({ page }) => {
    await signInPage.clickForgotPasswordLink();
    await passwordResetPage.enterEmail('user@shop.test');
    await passwordResetPage.clickSendButton();

    await expect(page.getByText('Відновлення пароля')).toBeVisible();
    await expect(page.getByTestId('reset-sent-email')).toHaveText('user@shop.test');

    await passwordResetPage.openMailbox();
    const mail = page.getByTestId('mail-item');
    await expect(mail.getByTestId('mail-to')).toHaveText('user@shop.test');
    await expect(mail).toHaveCount(1);

    await passwordResetPage.clickMailResetLink();
    await expect(page).toHaveURL(/\/reset-password\/.+/);
    await expect(page.getByTestId('page-title').nth(0)).toContainText('Новий пароль');
  });

  test('should set new password via reset link', async ({ page, request }) => {
    await request.post('/forgot-password', { form: { email: 'user@shop.test' } });
    const mails = await (await request.get('/api/test/mailbox')).json();
    await passwordResetPage.openResetLink(mails[0].link);

    await passwordResetPage.enterPassword('NewPass123');
    await passwordResetPage.confirmPassword('NewPass123');
    await passwordResetPage.clickSubmitButton();
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('flash-message')).toHaveText('Пароль змінено. Увійдіть з новим паролем.');

    await signInPage.enterEmail('user@shop.test');
    await signInPage.enterPassword('NewPass123');
    await signInPage.clickSubmitButton();
    await expect(page).toHaveURL('/account');
  });
});
