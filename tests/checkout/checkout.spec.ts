import { test, expect } from '@playwright/test';
import { CheckoutPage } from '../../src/pages/checkout';

let checkoutPage;
// у кошику 1 шт. товару №31 «Чиста архітектура» за 549 грн — дешевше за поріг безкоштовної доставки (3 000 грн)
test.beforeEach(async ({ page, request }) => {
  await request.post('/api/test/reset');
  await page.request.post('/api/cart', { data: { productId: 31, qty: 1 } });
  checkoutPage = new CheckoutPage(page);
  await checkoutPage.open();
});

test.describe('Shipping', () => {
  test('should validate required shipping fields', async ({ page }) => {
    await checkoutPage.checkCourierDelivery();
    await checkoutPage.checkCashPayment();
    await checkoutPage.checkTermCheckbox();
    await checkoutPage.clickPlaceOrderButton();

    await expect(page).toHaveURL('/checkout');
    await expect(page.getByTestId('validation-summary')).toHaveText('Перевірте правильність заповнення форми');
    await expect(page.getByTestId('error-name')).toHaveText("Вкажіть ім'я та прізвище");
    await expect(page.getByTestId('error-email')).toHaveText('Вкажіть коректний email');
    await expect(page.getByTestId('error-phone')).toHaveText('Телефон у форматі +380XXXXXXXXX');
    await expect(page.getByTestId('error-city')).toHaveText('Вкажіть місто');
    await expect(page.getByTestId('error-address')).toHaveText('Вкажіть адресу доставки');
  });

  test('should update total for selected delivery method', async ({ page }) => {
    await checkoutPage.checkCourierDelivery();
    await expect(page.getByTestId('summary-shipping')).toHaveText('100 грн');
    await expect(page.getByTestId('summary-total')).toHaveText('649 грн');

    await checkoutPage.checkPostDelivery();
    await expect(page.getByTestId('summary-shipping')).toHaveText('60 грн');
    await expect(page.getByTestId('summary-total')).toHaveText('609 грн');

    await checkoutPage.checkPickupDelivery();
    await expect(page.getByTestId('summary-shipping')).toHaveText('безкоштовно');
    await expect(page.getByTestId('summary-total')).toHaveText('549 грн');
  });
});

test.describe('Payment', () => {
  test('should place order with valid card', async ({ page }) => {
    await checkoutPage.enterName('Test Customer');
    await checkoutPage.enterEmail('guest@example.com');
    await checkoutPage.enterPhone('+380501234567');
    await checkoutPage.checkCourierDelivery();
    await checkoutPage.enterCity('Київ');
    await checkoutPage.enterAddress('вул. Хрещатик, 1, кв. 5');
    await checkoutPage.checkCardPayment();
    await checkoutPage.enterCardNumber('4242 4242 4242 4242');
    await checkoutPage.enterCardExpiry('12/30');
    await checkoutPage.enterCardCvv('123');
    await checkoutPage.checkTermCheckbox();
    await checkoutPage.clickPlaceOrderButton();

    await expect(page).toHaveURL(/\/order\/\d+\/success/);
    await expect(page.getByTestId('order-success')).toContainText('Дякуємо за замовлення!');
    await expect(page.getByTestId('order-total')).toHaveText('649 грн');
  });

  test('should show error for declined card', async ({ page }) => {
    // картку 4000 0000 0000 0002 «банк» завжди відхиляє
    await checkoutPage.enterName('Test Customer');
    await checkoutPage.enterEmail('guest@example.com');
    await checkoutPage.enterPhone('+380501234567');
    await checkoutPage.checkCourierDelivery();
    await checkoutPage.enterCity('Київ');
    await checkoutPage.enterAddress('вул. Хрещатик, 1, кв. 5');
    await checkoutPage.checkCardPayment();
    await checkoutPage.enterCardNumber('4000 0000 0000 0002');
    await checkoutPage.enterCardExpiry('12/30');
    await checkoutPage.enterCardCvv('123');
    await checkoutPage.checkTermCheckbox();
    await checkoutPage.clickPlaceOrderButton();

    await expect(page.getByTestId('form-error')).toHaveText('Платіж відхилено банком. Спробуйте іншу картку.');
    await expect(page).toHaveURL('/checkout');
  });

  // на сайті немає 3DS-підтвердження платежу
  test.fixme('should complete payment with 3DS authentication', async ({ page }) => {});

  test('should not create duplicate order on double click', async ({ page }) => {
    // входимо, щоб потім порахувати замовлення користувача через API
    await page.request.post('/api/login', { data: { email: 'user@shop.test', password: 'Password123' } });
    await page.request.post('/api/cart', { data: { productId: 31, qty: 1 } });
    await checkoutPage.open();
    await checkoutPage.checkPickupDelivery();
    await checkoutPage.selectStore('Київ, вул. Хрещатик, 22');
    await checkoutPage.checkCashPayment();
    await checkoutPage.checkTermCheckbox();
    await checkoutPage.doubleClickPlaceOrderButton();

    await expect(page).toHaveURL(/\/order\/\d+\/success/);
    const orders = await (await page.request.get('/api/orders')).json();
    expect(orders).toHaveLength(1);
  });

  test('should keep cart when user returns from payment', async ({ page }) => {
    await checkoutPage.enterName('Test Customer');
    await checkoutPage.enterEmail('guest@example.com');
    await checkoutPage.enterPhone('+380501234567');
    await checkoutPage.checkCourierDelivery();
    await checkoutPage.enterCity('Київ');
    await checkoutPage.enterAddress('вул. Хрещатик, 1, кв. 5');
    await checkoutPage.checkCardPayment();
    await checkoutPage.enterCardNumber('4000 0000 0000 0002');
    await checkoutPage.enterCardExpiry('12/30');
    await checkoutPage.enterCardCvv('123');
    await checkoutPage.checkTermCheckbox();
    await checkoutPage.clickPlaceOrderButton();
    await expect(page.getByTestId('form-error')).toBeVisible();

    await checkoutPage.clickBackToCartLink();
    await expect(page).toHaveURL('/cart');
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-item-name')).toHaveText('Чиста архітектура');
  });
});

test.describe('Order confirmation', () => {
  test('should show thank you page with order number', async ({ page }) => {
    await checkoutPage.enterName('Test Customer');
    await checkoutPage.enterEmail('guest@example.com');
    await checkoutPage.enterPhone('+380501234567');
    await checkoutPage.checkPostDelivery();
    await checkoutPage.enterCity('Львів');
    await checkoutPage.enterPostOffice('12');
    await checkoutPage.checkCashPayment();
    await checkoutPage.checkTermCheckbox();
    await checkoutPage.clickPlaceOrderButton();

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
