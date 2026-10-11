import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('/api/test/reset');
});

test('should apply valid promo code',  async ({ page }) => {
  // товар №1 коштує 12 999 грн, SAVE10 дає знижку 10%
  await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
  await page.goto('/cart');
  await page.getByTestId('promo-input').fill('SAVE10');
  await page.getByTestId('promo-apply').click();
  await expect(page.getByTestId('flash-message')).toHaveText('Промокод SAVE10 застосовано');
  await expect(page.getByTestId('promo-code')).toHaveText('SAVE10');
  await expect(page.getByTestId('summary-subtotal')).toHaveText('12 999 грн');
  await expect(page.getByTestId('summary-discount')).toHaveText('−1 300 грн');
  await expect(page.getByTestId('summary-total')).toHaveText('11 699 грн');
});

test('should reject invalid promo code',  async ({ page }) => {
  await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
  await page.goto('/cart');
  await page.getByTestId('promo-input').fill('WRONGCODE');
  await page.getByTestId('promo-apply').click();
  await expect(page.getByTestId('flash-message')).toHaveText('Промокод не знайдено');
  await expect(page.getByTestId('promo-applied')).toHaveCount(0);
  await expect(page.getByTestId('summary-total')).toHaveText('12 999 грн');
});

test('should reject expired promo code',  async ({ page }) => {
  await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
  await page.goto('/cart');
  await page.getByTestId('promo-input').fill('EXPIRED2025');
  await page.getByTestId('promo-apply').click();
  await expect(page.getByTestId('flash-message')).toHaveText('Термін дії промокоду минув');
  await expect(page.getByTestId('promo-applied')).toHaveCount(0);
  await expect(page.getByTestId('summary-total')).toHaveText('12 999 грн');
});

test('should reject promo code below minimum order amount',  async ({ page }) => {
  // MINUS200 діє від 1 000 грн, а товар №48 коштує 349 грн
  await page.request.post('/api/cart', { data: { productId: 48, qty: 1 } });
  await page.goto('/cart');
  await page.getByTestId('promo-input').fill('MINUS200');
  await page.getByTestId('promo-apply').click();
  await expect(page.getByTestId('flash-message')).toHaveText('Мінімальна сума для цього промокоду — 1 000 грн');
  await expect(page.getByTestId('promo-applied')).toHaveCount(0);
  await expect(page.getByTestId('summary-total')).toHaveText('349 грн');
});
