import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/test/reset');
  await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
  await page.goto('/cart');
});

test('should recalculate total when quantity changes',  async ({ page }) => {
  const qty = page.getByTestId('cart-item-qty');
  await qty.fill('2');
  await qty.press('Tab'); // кошик оновиться, коли користувач завершив зміну поля, тобто курсор вийшов з поля.
  await expect(qty).toHaveValue('2');
  await expect(page.getByTestId('cart-item-total')).toHaveText('25 998 грн');
  await expect(page.getByTestId('summary-total')).toHaveText('25 998 грн');
});

test('should remove item from cart',  async ({ page }) => {
  await page.getByTestId('cart-item-remove').click();
  await expect(page.getByTestId('flash-message')).toContainText('«Смартфон Nova X1 128 ГБ» видалено з кошика');
  await expect(page.getByTestId('empty-cart')).toContainText('Ваш кошик порожній.');
});

test('clear cart',  async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept()); // підтверджуємо вікно «Очистити кошик?»
  await page.getByTestId('clear-cart').click();
  await expect(page.getByTestId('flash-message')).toContainText('Кошик очищено');
  await expect(page.getByTestId('empty-cart')).toContainText('Ваш кошик порожній.');
});

test('should not allow quantity above available stock',  async ({ page }) => {
  const qty = page.getByTestId('cart-item-qty');
  await qty.fill('11');
  await qty.press('Tab'); // кошик оновиться, коли користувач завершив зміну поля, тобто курсор вийшов з поля.
  await expect(page.getByTestId('flash-message')).toContainText('Доступно не більше 10 шт.');
  await expect(page.getByTestId('cart-item')).toHaveCount(1);
  await expect(qty).toHaveValue('1');
});

test('should keep cart after page reload',  async ({ page }) => {
  await page.reload();
  await expect(page.getByTestId('cart-item')).toHaveCount(1);
  await expect(page.getByTestId('cart-item-qty')).toHaveValue('1');
});

test('should merge guest cart with user cart after login',  async ({ page }) => {
  await page.getByTestId('login-link').click();
  await page.getByTestId('input-email').fill('user@shop.test');
  await page.getByTestId('input-password').fill('Password123');
  await page.getByTestId('login-submit').click();
  await expect(page.goto('/cart'));
  const qty = page.getByTestId('cart-item-qty');
  await expect(qty).toHaveValue('1');
  await expect(page.getByTestId('cart-item-total')).toHaveText('12 999 грн');
});