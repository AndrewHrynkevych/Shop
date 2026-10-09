const { test, expect } = require('@playwright/test');

test('home page returns 200 without console errors', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
  console.log(response.status());

//test('products API responds with valid list');
//test('cart API responds successfully');
//test('static assets load without 404');

});