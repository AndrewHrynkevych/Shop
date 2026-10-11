import { test, expect } from '@playwright/test';

test.describe('Password reset', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/test/reset');
    await page.goto('/login');
  });

  // повертаємо початковий пароль, щоб не зламати тести на вхід в інших файлах
  test.afterEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('send reset email for registered user', async ({ page }) => {
    await page.getByTestId('forgot-password-link').click();
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('forgot-submit').click();
    await expect(page.getByText('Відновлення пароля')).toBeVisible();
    await expect(page.getByTestId('reset-sent-email')).toHaveText('user@shop.test');
    await page.goto('/mailbox');
    const mail = page.getByTestId('mail-item');
    await expect(mail.getByTestId('mail-to')).toHaveText('user@shop.test');
    await expect(mail).toHaveCount(1);
    await page.getByTestId('mail-reset-link').click();
    await expect(page).toHaveURL(/\/reset-password\/.+/);
    await expect(page.getByTestId('page-title').nth(0)).toContainText('Новий пароль');

  });
  
  test('should set new password via reset link', async ({ page, request }) => {
    await request.post('/forgot-password', { form: { email: 'user@shop.test' } });
    const mails = await (await request.get('/api/test/mailbox')).json();
    await page.goto(mails[0].link);

    await page.getByTestId('input-password').fill('NewPass123');
    await page.getByTestId('input-confirmPassword').fill('NewPass123');
    await page.getByTestId('reset-submit').click();
    await expect(page).toHaveURL('/login');
    await expect(page.getByTestId('flash-message')).toHaveText('Пароль змінено. Увійдіть з новим паролем.');

    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('NewPass123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/account');
  });
});