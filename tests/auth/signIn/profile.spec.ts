import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('able to update personal info', async ({ page }) => {
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/account');
    await page.getByTestId('input-name').fill('Updated Customer');
    await expect(page.getByTestId('profile-email')).toBeDisabled();
    await page.getByTestId('input-phone').fill('+380507802347');
    await page.getByTestId('profile-save').click();
    await expect(page.getByTestId('flash-message')).toBeVisible();
    await expect(page.getByTestId('input-name')).toHaveValue('Updated Customer');
    await expect(page.getByTestId('input-phone')).toHaveValue('+380507802347');
});
  test('able to check purchases', async ({ page }) => {
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await page.getByTestId('account-orders-tab').click();
    await expect(page).toHaveURL('/account/orders');
});

});