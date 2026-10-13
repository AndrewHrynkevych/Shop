import { test, expect } from '@playwright/test';
import { CartPage } from '../../src/pages/cart';

let cartPage;
test.beforeEach(async ({ page, request }) => {
  await request.post('/api/test/reset');
  cartPage = new CartPage(page);
});

test('should apply valid promo code',  async ({ page }) => {
  // товар №1 коштує 12 999 грн, SAVE10 дає знижку 10%
  await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
  await cartPage.open();
  await cartPage.enterPromoCode('SAVE10');
  await cartPage.clickApplyPromoButton();

  await expect(page.getByTestId('flash-message')).toHaveText('Промокод SAVE10 застосовано');
  await expect(page.getByTestId('promo-code')).toHaveText('SAVE10');
  await expect(page.getByTestId('summary-subtotal')).toHaveText('12 999 грн');
  await expect(page.getByTestId('summary-discount')).toHaveText('−1 300 грн');
  await expect(page.getByTestId('summary-total')).toHaveText('11 699 грн');
});

test('should reject invalid promo code',  async ({ page }) => {
  await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
  await cartPage.open();
  await cartPage.enterPromoCode('WRONGCODE');
  await cartPage.clickApplyPromoButton();

  await expect(page.getByTestId('flash-message')).toHaveText('Промокод не знайдено');
  await expect(page.getByTestId('promo-applied')).toHaveCount(0);
  await expect(page.getByTestId('summary-total')).toHaveText('12 999 грн');
});

test('should reject expired promo code',  async ({ page }) => {
  await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
  await cartPage.open();
  await cartPage.enterPromoCode('EXPIRED2025');
  await cartPage.clickApplyPromoButton();

  await expect(page.getByTestId('flash-message')).toHaveText('Термін дії промокоду минув');
  await expect(page.getByTestId('promo-applied')).toHaveCount(0);
  await expect(page.getByTestId('summary-total')).toHaveText('12 999 грн');
});

test('should reject promo code below minimum order amount',  async ({ page }) => {
  // MINUS200 діє від 1 000 грн, а товар №48 коштує 349 грн
  await page.request.post('/api/cart', { data: { productId: 48, qty: 1 } });
  await cartPage.open();
  await cartPage.enterPromoCode('MINUS200');
  await cartPage.clickApplyPromoButton();

  await expect(page.getByTestId('flash-message')).toHaveText('Мінімальна сума для цього промокоду — 1 000 грн');
  await expect(page.getByTestId('promo-applied')).toHaveCount(0);
  await expect(page.getByTestId('summary-total')).toHaveText('349 грн');
});
