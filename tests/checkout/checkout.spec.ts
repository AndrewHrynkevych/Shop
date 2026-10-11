import { test, expect } from '@playwright/test';

// у кошику 1 шт. товару №31 «Чиста архітектура» за 549 грн — дешевше за поріг безкоштовної доставки (3 000 грн)
test.beforeEach(async ({ page, request }) => {
  await request.post('/api/test/reset');
  await page.request.post('/api/cart', { data: { productId: 31, qty: 1 } });
  await page.goto('/checkout');
});

test.describe('Shipping', () => {
  test('should validate required shipping fields', async ({ page }) => {
    await page.getByTestId('delivery-courier').check();
    await page.getByTestId('payment-cash').check();
    await page.getByTestId('input-terms').check();
    await page.getByTestId('place-order').click();
    await expect(page).toHaveURL('/checkout');
    await expect(page.getByTestId('validation-summary')).toHaveText('Перевірте правильність заповнення форми');
    await expect(page.getByTestId('error-name')).toHaveText("Вкажіть ім'я та прізвище");
    await expect(page.getByTestId('error-email')).toHaveText('Вкажіть коректний email');
    await expect(page.getByTestId('error-phone')).toHaveText('Телефон у форматі +380XXXXXXXXX');
    await expect(page.getByTestId('error-city')).toHaveText('Вкажіть місто');
    await expect(page.getByTestId('error-address')).toHaveText('Вкажіть адресу доставки');
  });

  test('should update total for selected delivery method', async ({ page }) => {
    await page.getByTestId('delivery-courier').check();
    await expect(page.getByTestId('summary-shipping')).toHaveText('100 грн');
    await expect(page.getByTestId('summary-total')).toHaveText('649 грн');

    await page.getByTestId('delivery-post').check();
    await expect(page.getByTestId('summary-shipping')).toHaveText('60 грн');
    await expect(page.getByTestId('summary-total')).toHaveText('609 грн');

    await page.getByTestId('delivery-pickup').check();
    await expect(page.getByTestId('summary-shipping')).toHaveText('безкоштовно');
    await expect(page.getByTestId('summary-total')).toHaveText('549 грн');
  });
});

test.describe('Payment', () => {
  test('should place order with valid card', async ({ page }) => {
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
    await expect(page.getByTestId('order-total')).toHaveText('649 грн');
  });

  test('should show error for declined card', async ({ page }) => {
    // картку 4000 0000 0000 0002 «банк» завжди відхиляє
    await page.getByTestId('input-name').fill('Test Customer');
    await page.getByTestId('input-email').fill('guest@example.com');
    await page.getByTestId('input-phone').fill('+380501234567');
    await page.getByTestId('delivery-courier').check();
    await page.getByTestId('input-city').fill('Київ');
    await page.getByTestId('input-address').fill('вул. Хрещатик, 1, кв. 5');
    await page.getByTestId('payment-card').check();
    await page.getByTestId('input-cardNumber').fill('4000 0000 0000 0002');
    await page.getByTestId('input-cardExpiry').fill('12/30');
    await page.getByTestId('input-cardCvv').fill('123');
    await page.getByTestId('input-terms').check();
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('form-error')).toHaveText('Платіж відхилено банком. Спробуйте іншу картку.');
    await expect(page).toHaveURL('/checkout');
  });

  // на сайті немає 3DS-підтвердження платежу
  test.fixme('should complete payment with 3DS authentication', async ({ page }) => {});

  test('should not create duplicate order on double click', async ({ page }) => {
    // входимо, щоб потім порахувати замовлення користувача через API
    await page.request.post('/api/login', { data: { email: 'user@shop.test', password: 'Password123' } });
    await page.request.post('/api/cart', { data: { productId: 31, qty: 1 } });
    await page.goto('/checkout');
    await page.getByTestId('delivery-pickup').check();
    await page.getByTestId('input-store').selectOption('Київ, вул. Хрещатик, 22');
    await page.getByTestId('payment-cash').check();
    await page.getByTestId('input-terms').check();
    await page.getByTestId('place-order').dblclick();
    await expect(page).toHaveURL(/\/order\/\d+\/success/);
    const orders = await (await page.request.get('/api/orders')).json();
    expect(orders).toHaveLength(1);
  });

  test('should keep cart when user returns from payment', async ({ page }) => {
    await page.getByTestId('input-name').fill('Test Customer');
    await page.getByTestId('input-email').fill('guest@example.com');
    await page.getByTestId('input-phone').fill('+380501234567');
    await page.getByTestId('delivery-courier').check();
    await page.getByTestId('input-city').fill('Київ');
    await page.getByTestId('input-address').fill('вул. Хрещатик, 1, кв. 5');
    await page.getByTestId('payment-card').check();
    await page.getByTestId('input-cardNumber').fill('4000 0000 0000 0002');
    await page.getByTestId('input-cardExpiry').fill('12/30');
    await page.getByTestId('input-cardCvv').fill('123');
    await page.getByTestId('input-terms').check();
    await page.getByTestId('place-order').click();
    await expect(page.getByTestId('form-error')).toBeVisible();

    await page.getByTestId('back-to-cart').click();
    await expect(page).toHaveURL('/cart');
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-item-name')).toHaveText('Чиста архітектура');
  });
});

test.describe('Order confirmation', () => {
  test('should show thank you page with order number', async ({ page }) => {
    await page.getByTestId('input-name').fill('Test Customer');
    await page.getByTestId('input-email').fill('guest@example.com');
    await page.getByTestId('input-phone').fill('+380501234567');
    await page.getByTestId('delivery-post').check();
    await page.getByTestId('input-city').fill('Львів');
    await page.getByTestId('input-postOffice').fill('12');
    await page.getByTestId('payment-cash').check();
    await page.getByTestId('input-terms').check();
    await page.getByTestId('place-order').click();
    // після скидання бази перше нове замовлення отримує номер 1003
    await expect(page).toHaveURL('/order/1003/success');
    await expect(page.getByTestId('order-success')).toContainText('Дякуємо за замовлення!');
    await expect(page.getByTestId('order-number')).toHaveText('1003');
    await expect(page.getByTestId('order-total')).toHaveText('609 грн');
    await expect(page.getByTestId('order-email')).toHaveText('guest@example.com');
    await expect(page.getByTestId('order-delivery')).toHaveText('Відділення пошти');
  });

  // сайт не надсилає лист про замовлення: у демо-пошту /mailbox потрапляють лише листи для зміни пароля
  test.fixme('should send order confirmation email', async ({ page }) => {});
});
