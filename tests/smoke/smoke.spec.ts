import { test, expect } from '@playwright/test';
import { Header } from '../../src/pages/header';
import { CatalogPage } from '../../src/pages/catalog';
import { ProductPage } from '../../src/pages/product';
import { CartPage } from '../../src/pages/cart';
import { CheckoutPage } from '../../src/pages/checkout';
import { SignInPage } from '../../src/pages/signIn';

test.describe('Critical path', { tag: '@smoke' }, () => {
  let header;
  let catalogPage;
  let productPage;
  let cartPage;
  let checkoutPage;
  let signInPage;
  test.beforeEach(async ({ page, request }) => {
    await request.post('/api/test/reset');
    header = new Header(page);
    catalogPage = new CatalogPage(page);
    productPage = new ProductPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);
    signInPage = new SignInPage(page);
  });

  test('user can find product via search and open its page', async ({ page }) => {
    await header.open();
    await header.enterSearchQuery('Смартфон Nova X1 128 ГБ');
    await header.clickSearchButton();
    await expect(page).toHaveURL(/\/catalog\?q=.+/);
    await expect(page.getByTestId('product-card')).toHaveCount(1);

    await catalogPage.clickProductName();
    await expect(page).toHaveURL('/product/1');
    await expect(page.getByTestId('product-title')).toHaveText('Смартфон Nova X1 128 ГБ');
  });

  test('user can add product to cart', async ({ page }) => {
    await productPage.open(1);
    await productPage.clickAddToCart();

    await expect(page.getByTestId('toast')).toContainText('«Смартфон Nova X1 128 ГБ» додано до кошика');
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('user can open the cart', async ({ page }) => {
    await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
    await header.open();
    await header.clickCartLink();

    await expect(page).toHaveURL('/cart');
    await expect(page.getByTestId('cart-item')).toHaveCount(1);
    await expect(page.getByTestId('cart-item-name')).toHaveText('Смартфон Nova X1 128 ГБ');
  });

  test('user can delete product from the cart', async ({ page }) => {
    await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
    await cartPage.open();
    await cartPage.clickRemoveButton();

    await expect(page.getByTestId('flash-message')).toContainText('«Смартфон Nova X1 128 ГБ» видалено з кошика');
    await expect(page.getByTestId('empty-cart')).toContainText('Ваш кошик порожній.');
  });

  test('user can clear the cart list', async ({ page }) => {
    await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
    await page.request.post('/api/cart', { data: { productId: 2, qty: 1 } });
    await cartPage.open();
    await expect(page.getByTestId('cart-item')).toHaveCount(2);

    await cartPage.clickClearCartButton();
    await expect(page.getByTestId('flash-message')).toContainText('Кошик очищено');
    await expect(page.getByTestId('empty-cart')).toContainText('Ваш кошик порожній.');
  });

  test('user can checkout', async ({ page }) => {
    await page.request.post('/api/cart', { data: { productId: 1, qty: 1 } });
    await cartPage.open();
    await cartPage.clickCheckoutButton();

    await expect(page).toHaveURL('/checkout');
    await expect(page.getByTestId('page-title')).toHaveText('Оформлення замовлення');
    await expect(page.getByTestId('summary-item')).toContainText('Смартфон Nova X1 128 ГБ × 1');
    await expect(page.getByTestId('summary-total')).toHaveText('12 999 грн');
  });

  test('registered user can log in', async ({ page }) => {
    await signInPage.open();
    await signInPage.enterEmail('user@shop.test');
    await signInPage.enterPassword('Password123');
    await signInPage.clickSubmitButton();

    await expect(page).toHaveURL('/account');
    await expect(page.getByTestId('user-name')).toHaveText('Тестовий Користувач');
  });

  test('not logged-in user can complete purchase end-to-end', async ({ page }) => {
    await productPage.open(1);
    await productPage.clickAddToCart();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await header.clickCartLink();
    await cartPage.clickCheckoutButton();
    await expect(page).toHaveURL('/checkout');

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
    await expect(page.getByTestId('order-total')).toHaveText('12 999 грн');
    await expect(page.getByTestId('order-email')).toHaveText('guest@example.com');
    await expect(page.getByTestId('order-delivery')).toHaveText("Кур'єр");
    await expect(page.getByTestId('cart-count')).toHaveText('0');
  });

  test('logged-in user can complete purchase end-to-end', async ({ page }) => {
    await signInPage.open();
    await signInPage.enterEmail('user@shop.test');
    await signInPage.enterPassword('Password123');
    await signInPage.clickSubmitButton();
    await expect(page).toHaveURL('/account');

    await productPage.open(1);
    await productPage.clickAddToCart();
    await expect(page.getByTestId('cart-count')).toHaveText('1');
    await header.clickCartLink();
    await cartPage.clickCheckoutButton();
    await expect(page).toHaveURL('/checkout');

    // контактні дані підставляються з профілю
    await expect(page.getByTestId('input-name')).toHaveValue('Тестовий Користувач');
    await expect(page.getByTestId('input-email')).toHaveValue('user@shop.test');
    await checkoutPage.checkPickupDelivery();
    await checkoutPage.selectStore('Київ, вул. Хрещатик, 22');
    await checkoutPage.checkCashPayment();
    await checkoutPage.checkTermCheckbox();
    await checkoutPage.clickPlaceOrderButton();

    await expect(page).toHaveURL(/\/order\/\d+\/success/);
    await expect(page.getByTestId('order-success')).toContainText('Дякуємо за замовлення!');
    await expect(page.getByTestId('order-total')).toHaveText('12 999 грн');
    await expect(page.getByTestId('order-delivery')).toHaveText('Самовивіз з магазину');

    await checkoutPage.clickViewOrderLink();
    await expect(page).toHaveURL(/\/account\/orders\/\d+/);
    await expect(page.getByTestId('page-title')).toContainText('Замовлення №');
  });
});
