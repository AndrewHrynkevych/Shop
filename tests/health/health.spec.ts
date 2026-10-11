import { test, expect } from '@playwright/test';

test.describe('Health', () => {
  test('home page returns 200 without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    expect(errors).toEqual([]);
  });

  test('products API responds with valid list', async ({ request }) => {
    const response = await request.get('/api/products');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.total).toBeGreaterThan(0);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(body.perPage);
    for (const product of body.items) {
      expect(typeof product.id).toBe('number');
      expect(typeof product.name).toBe('string');
      expect(product.price).toBeGreaterThan(0);
    }
  });

  test('cart API responds successfully', async ({ request }) => {
    const response = await request.get('/api/cart');
    expect(response.status()).toBe(200);

    // нова сесія — кошик порожній
    const body = await response.json();
    expect(body.items).toEqual([]);
    expect(body.count).toBe(0);
    expect(body.total).toBe(0);
  });

  test('static assets load without 404', async ({ page }) => {
    const loaded: string[] = [];
    const failed: string[] = [];
    page.on('response', (response) => {
      loaded.push(response.url());
      if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`);
    });

    await page.goto('/');
    expect(failed).toEqual([]);
    expect(loaded.some((url) => url.endsWith('/static/style.css'))).toBe(true);
    expect(loaded.some((url) => url.endsWith('/static/app.js'))).toBe(true);
  });
});
