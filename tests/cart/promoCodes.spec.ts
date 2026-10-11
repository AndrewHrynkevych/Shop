import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/test/reset');
  await page.goto('/cart');
});

test('should apply valid promo code',  async ({ page }) => {
});
test('should reject invalid promo code',  async ({ page }) => {
});
test('should reject expired promo code',  async ({ page }) => {
});
test('should reject promo code below minimum order amount',  async ({ page }) => {
});