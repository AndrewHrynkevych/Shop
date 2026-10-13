import { test, expect } from '@playwright/test';
import { SignInPage } from '../../src/pages/signIn';
import { CheckoutPage } from '../../src/pages/checkout';
import { OrdersPage } from '../../src/pages/orders';
import { Header } from '../../src/pages/header';

test.describe('Order history', () => {
  let signInPage;
  let checkoutPage;
  let ordersPage;
  let header;
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/test/reset');
    signInPage = new SignInPage(page);
    checkoutPage = new CheckoutPage(page);
    ordersPage = new OrdersPage(page);
    header = new Header(page);
    await signInPage.open();
  });

  test('should display new order with correct status and total', async ({ page }) => {
    await signInPage.enterEmail('user@shop.test');
    await signInPage.enterPassword('Password123');
    await signInPage.clickSubmitButton();
    await expect(page).toHaveURL('/account');

    // оформлюємо замовлення: 2 шт. товару №1 по 12 999 грн, самовивіз, готівка
    await page.request.post('/api/cart', { data: { productId: 1, qty: 2 } });
    await checkoutPage.open();
    await checkoutPage.checkPickupDelivery();
    await checkoutPage.selectStore('Київ, вул. Хрещатик, 22');
    await checkoutPage.checkCashPayment();
    await checkoutPage.checkTermCheckbox();
    await checkoutPage.clickPlaceOrderButton();
    await expect(page).toHaveURL(/\/order\/\d+\/success/);

    await header.clickOrdersLink();
    await expect(page).toHaveURL('/account/orders');
    await expect(page.getByTestId('order-row')).toHaveCount(1);
    await expect(page.getByTestId('order-status')).toHaveText('Нове');
    await expect(page.getByTestId('order-items-count')).toHaveText('2');
    await expect(page.getByTestId('order-total')).toHaveText('25 998 грн');

    await ordersPage.clickOrderDetailsLink();
    await expect(page.getByTestId('order-status')).toHaveText('Нове');
    await expect(page.getByTestId('order-item-name')).toHaveText('Смартфон Nova X1 128 ГБ');
    await expect(page.getByTestId('order-item-qty')).toHaveText('2');
    await expect(page.getByTestId('summary-total')).toHaveText('25 998 грн');
  });

  test('should cancel order', async ({ page }) => {
    // у buyer@shop.test вже є замовлення №1002 зі статусом «Нове»
    await signInPage.enterEmail('buyer@shop.test');
    await signInPage.enterPassword('Password123');
    await signInPage.clickSubmitButton();
    await expect(page).toHaveURL('/account');

    await ordersPage.openOrder(1002);
    await expect(page.getByTestId('order-status')).toHaveText('Нове');
    await ordersPage.clickCancelOrderButton();

    await expect(page).toHaveURL('/account/orders/1002');
    await expect(page.getByTestId('flash-message')).toHaveText('Замовлення №1002 скасовано');
    await expect(page.getByTestId('order-status')).toHaveText('Скасовано');
    await expect(page.getByTestId('cancel-order')).toHaveCount(0);
  });

  test('should decrease product stock after purchase', async ({ page }) => {
    const before = await (await page.request.get('/api/products/1')).json();

    await signInPage.enterEmail('user@shop.test');
    await signInPage.enterPassword('Password123');
    await signInPage.clickSubmitButton();
    await expect(page).toHaveURL('/account');

    await page.request.post('/api/cart', { data: { productId: 1, qty: 2 } });
    await checkoutPage.open();
    await checkoutPage.checkPickupDelivery();
    await checkoutPage.selectStore('Київ, вул. Хрещатик, 22');
    await checkoutPage.checkCashPayment();
    await checkoutPage.checkTermCheckbox();
    await checkoutPage.clickPlaceOrderButton();
    await expect(page).toHaveURL(/\/order\/\d+\/success/);

    const after = await (await page.request.get('/api/products/1')).json();
    expect(after.stock).toBe(before.stock - 2);
  });
});
