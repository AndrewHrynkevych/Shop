import { test, expect } from '@playwright/test';

test.describe('Critical path', { tag: '@smoke' }, () => {
  test('user can find product via search and open its page');
  test('user can add product to cart');
  test('user can add open the cart');
  test('user can delete product from the cart');
  test('user can clear the cart list');
  test('user can checkout');
  test('registered user can log in');
  test('not logged-in user can complete purchase end-to-end');
  test('logged-in user can complete purchase end-to-end');
});