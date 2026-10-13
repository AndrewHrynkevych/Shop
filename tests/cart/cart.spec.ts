import { test, expect } from '@playwright/test';
import { CartPage } from '../../src/pages/cart';
import { Header } from '../../src/pages/header';
import { SignInPage } from '../../src/pages/signIn';

let cartPage;
let header;
let signInPage;
test.beforeEach(async ({ page, request }) => {
  await request.post('/api/test/reset');
  await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
  cartPage = new CartPage(page);
  header = new Header(page);
  signInPage = new SignInPage(page);
  await cartPage.open();
});

test('should recalculate total when quantity changes',  async ({ page }) => {
  await cartPage.enterQuantity('2');

  await expect(page.getByTestId('cart-item-qty')).toHaveValue('2');
  await expect(page.getByTestId('cart-item-total')).toHaveText('25 998 грн');
  await expect(page.getByTestId('summary-total')).toHaveText('25 998 грн');
});

test('should remove item from cart',  async ({ page }) => {
  await cartPage.clickRemoveButton();

  await expect(page.getByTestId('flash-message')).toContainText('«Смартфон Nova X1 128 ГБ» видалено з кошика');
  await expect(page.getByTestId('empty-cart')).toContainText('Ваш кошик порожній.');
});

test('clear cart',  async ({ page }) => {
  await cartPage.clickClearCartButton();

  await expect(page.getByTestId('flash-message')).toContainText('Кошик очищено');
  await expect(page.getByTestId('empty-cart')).toContainText('Ваш кошик порожній.');
});

test('should not allow quantity above available stock',  async ({ page }) => {
  await cartPage.enterQuantity('11');

  await expect(page.getByTestId('flash-message')).toContainText('Доступно не більше 10 шт.');
  await expect(page.getByTestId('cart-item')).toHaveCount(1);
  await expect(page.getByTestId('cart-item-qty')).toHaveValue('1');
});

test('should keep cart after page reload',  async ({ page }) => {
  await page.reload();

  await expect(page.getByTestId('cart-item')).toHaveCount(1);
  await expect(page.getByTestId('cart-item-qty')).toHaveValue('1');
});

test('should merge guest cart with user cart after login',  async ({ page }) => {
  await header.clickLoginLink();
  await signInPage.enterEmail('user@shop.test');
  await signInPage.enterPassword('Password123');
  await signInPage.clickSubmitButton();
  await cartPage.open();

  await expect(page.getByTestId('cart-item-qty')).toHaveValue('1');
  await expect(page.getByTestId('cart-item-total')).toHaveText('12 999 грн');
});
