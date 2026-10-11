import { test, expect } from '@playwright/test';

test.describe('Critical path', { tag: '@smoke' }, () => {
  test.beforeEach(async ({ request }) => {
    await request.post('/api/test/reset');
  });

  test('user can find product via search and open its page', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('search-input').fill('Смартфон Nova X1 128 ГБ');
    await page.getByTestId('search-button').click();
    await expect(page).toHaveURL(/\/catalog\?q=.+/);
    await expect(page.getByTestId('product-card')).toHaveCount(1);
    await page.getByTestId('product-name').click();
    await expect(page).toHaveURL('/product/1');
    await expect(page.getByTestId('product-title')).toHaveText('Смартфон Nova X1 128 ГБ');
  });

  test('user can add product to cart', async ({ page }) => {
    await page.goto('/product/1');
    // на сторінці є ще кнопки add-to-cart у «Схожих товарах», тому шукаємо в блоці товару
    await page.getByTestId('product-details').getByTestId('add-to-cart').click();
    await expect(page.getByTestId('toast')).toContainText('«Смартфон Nova X1 128 ГБ» додано до кошика');
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('user can open the cart', async ({ page }) => {
    await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
    await page.goto('/');
    await page.getByTestId('cart-link').click();
    await expect(page).toHaveURL('/cart');
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-item-name')).toHaveText('Смартфон Nova X1 128 ГБ');
  });

  test('user can delete product from the cart', async ({ page }) => {
    await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
    await page.goto('/cart');
    await page.getByTestId('cart-item-remove').click();
    await expect(page.getByTestId('flash-message')).toContainText('«Смартфон Nova X1 128 ГБ» видалено з кошика');
    await expect(page.getByTestId('empty-cart')).toContainText('Ваш кошик порожній.');
  });

  test('user can clear the cart list', async ({ page }) => {
    await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
    await page.request.post('/api/cart', { data: { productId: 2, qty: 1 } });
    await page.goto('/cart');
    await expect(page.getByTestId('cart-item')).toHaveCount(2);
    page.on('dialog', (dialog) => dialog.accept()); // підтверджуємо вікно «Очистити кошик?»
    await page.getByTestId('clear-cart').click();
    await expect(page.getByTestId('flash-message')).toContainText('Кошик очищено');
    await expect(page.getByTestId('empty-cart')).toContainText('Ваш кошик порожній.');
  });

  test('user can checkout', async ({ page }) => {
    await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
    await page.goto('/cart');
    await page.getByTestId('checkout-button').click();
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByTestId('page-title')).toHaveText('Оформлення замовлення');
    await expect(page.getByTestId('summary-item')).toContainText('Смартфон Nova X1 128 ГБ × 1');
    await expect(page.getByTestId('summary-total')).toHaveText('12 999 грн');
  });

  test('registered user can log in', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/account');
    await expect(page.getByTestId('user-name')).toHaveText('Тестовий Користувач');
  });

  test('not logged-in user can complete purchase end-to-end', async ({ page }) => {
    await page.goto('/product/1');
    await page.getByTestId('product-details').getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await page.getByTestId('cart-link').click();
    await page.getByTestId('checkout-button').click();
    await expect(page).toHaveURL('/checkout');

    await page.getByTestId('input-name').fill('Test Customer');
    await page.getByTestId('input-email').fill('guest@example.com');
    await page.getByTestId('input-phone').fill('+380501234567');
    await page.getByTestId('delivery-courier').check();
    await page.getByTestId('input-city').fill('Київ');
    await page.getByTestId('input-address').fill('вул. Хрещатик, 1, кв. 5');
    await page.getByTestId('payment-card').check();
    await page.getByTestId('input-cardNumber').fill('4242 4242 4242 4242');
    await page.getByTestId('input-cardExpiry').fill('12/30');
    await page.getByTestId('input-cardCvv').fill('123');
    await page.getByTestId('input-terms').check();
    await page.getByTestId('place-order').click();

    await expect(page).toHaveURL(/\/order\/\d+\/success/);
    await expect(page.getByTestId('order-success')).toContainText('Дякуємо за замовлення!');
    await expect(page.getByTestId('order-total')).toHaveText('12 999 грн');
    await expect(page.getByTestId('order-email')).toHaveText('guest@example.com');
    await expect(page.getByTestId('order-delivery')).toHaveText("Кур'єр");
    await expect(page.getByTestId('cart-count')).toHaveText('0');
  });

  test('logged-in user can complete purchase end-to-end', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('input-email').fill('user@shop.test');
    await page.getByTestId('input-password').fill('Password123');
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/account');

    await page.goto('/product/1');
    await page.getByTestId('product-details').getByTestId('add-to-cart').click();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await page.getByTestId('cart-link').click();
    await page.getByTestId('checkout-button').click();
    await expect(page).toHaveURL('/checkout');

    // контактні дані підставляються з профілю
    await expect(page.getByTestId('input-name')).toHaveValue('Тестовий Користувач');
    await expect(page.getByTestId('input-email')).toHaveValue('user@shop.test');
    await page.getByTestId('delivery-pickup').check();
    await page.getByTestId('input-store').selectOption('Київ, вул. Хрещатик, 22');
    await page.getByTestId('payment-cash').check();
    await page.getByTestId('input-terms').check();
    await page.getByTestId('place-order').click();

    await expect(page).toHaveURL(/\/order\/\d+\/success/);
    await expect(page.getByTestId('order-success')).toContainText('Дякуємо за замовлення!');
    await expect(page.getByTestId('order-total')).toHaveText('12 999 грн');
    await expect(page.getByTestId('order-delivery')).toHaveText('Самовивіз з магазину');

    await page.getByTestId('view-order').click();
    await expect(page).toHaveURL(/\/account\/orders\/\d+/);
    await expect(page.getByTestId('page-title')).toContainText('Замовлення №');
  });
});
