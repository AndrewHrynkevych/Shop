import { test, expect } from '@playwright/test';

test.describe('Password reset', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/test/reset');
    await page.goto('/login');
  });

  test('does not send reset email for unregistered user', async ({ page }) => {
    await page.getByTestId('forgot-password-link').click();
    await page.getByTestId('input-email').fill('user@shop.test1');
    await page.getByTestId('forgot-submit').click();
    await page.goto('/mailbox');
    await expect(page.getByTestId('mailbox-empty')).toContainText('Листів поки немає.');
  });
  
  test('show validation error when reset email with empty email', async ({ page, request }) => {
    await page.getByTestId('forgot-password-link').click();
    await page.getByTestId('input-email');
    await page.getByTestId('forgot-submit').click();
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.getByTestId('error-email')).toContainText('Введіть email');
  });
});