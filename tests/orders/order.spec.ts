import { test, expect } from '@playwright/test';

test.describe('Order history', () => {
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/test/reset');
    await page.goto('/login');
  });

  test('should display new order with correct status and total', async ({ page }) => {
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/account');

    // оформлюємо замовлення: 2 шт. товару №1 по 12 999 грн, самовивіз, готівка
    await page.request.post('/api/cart', { data: { productId: 1, qty: 2 } });
    await page.goto('/checkout');
    await page.getByTestId('delivery-pickup').check();
    await page.getByTestId('input-store').selectOption('Київ, вул. Хрещатик, 22');
    await page.getByTestId('payment-cash').check();
    await page.getByTestId('input-terms').check();
    await page.getByTestId('place-order').click();
    await expect(page).toHaveURL(/\/order\/\d+\/success/);

    await page.getByTestId('orders-link').click();
    await expect(page).toHaveURL('/account/orders');
    await expect(page.getByTestId('order-row')).toHaveCount(1);
    await expect(page.getByTestId('order-status')).toHaveText('Нове');
    await expect(page.getByTestId('order-items-count')).toHaveText('2');
    await expect(page.getByTestId('order-total')).toHaveText('25 998 грн');

    await page.getByTestId('order-details-link').click();
    await expect(page.getByTestId('order-status')).toHaveText('Нове');
    await expect(page.getByTestId('order-item-name')).toHaveText('Смартфон Nova X1 128 ГБ');
    await expect(page.getByTestId('order-item-qty')).toHaveText('2');
    await expect(page.getByTestId('summary-total')).toHaveText('25 998 грн');
  });

  test('should cancel order', async ({ page }) => {
    // у buyer@shop.test вже є замовлення №1002 зі статусом «Нове»
    await page.getByTestId('input-email').fill('buyer@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/account');

    await page.goto('/account/orders/1002');
    await expect(page.getByTestId('order-status')).toHaveText('Нове');
    page.on('dialog', (dialog) => dialog.accept()); // підтверджуємо вікно «Скасувати замовлення №1002?»
    await page.getByTestId('cancel-order').click();

    await expect(page).toHaveURL('/account/orders/1002');
    await expect(page.getByTestId('flash-message')).toHaveText('Замовлення №1002 скасовано');
    await expect(page.getByTestId('order-status')).toHaveText('Скасовано');
    await expect(page.getByTestId('cancel-order')).toHaveCount(0);
  });

  test('should decrease product stock after purchase', async ({ page }) => {
    const before = await (await page.request.get('/api/products/1')).json();

    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/account');

    await page.request.post('/api/cart', { data: { productId: 1, qty: 2 } });
    await page.goto('/checkout');
    await page.getByTestId('delivery-pickup').check();
    await page.getByTestId('input-store').selectOption('Київ, вул. Хрещатик, 22');
    await page.getByTestId('payment-cash').check();
    await page.getByTestId('input-terms').check();
    await page.getByTestId('place-order').click();
    await expect(page).toHaveURL(/\/order\/\d+\/success/);

    const after = await (await page.request.get('/api/products/1')).json();
    expect(after.stock).toBe(before.stock - 2);
  });
});
