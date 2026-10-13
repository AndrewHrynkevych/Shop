export class CartPage {
  constructor(page) {
    this.page = page;
    this.cartItem = page.getByTestId('cart-item');
    this.cartItemName = page.getByTestId('cart-item-name');
    this.qtyInput = page.getByTestId('cart-item-qty');
    this.cartItemTotal = page.getByTestId('cart-item-total');
    this.removeButton = page.getByTestId('cart-item-remove');
    this.clearCartButton = page.getByTestId('clear-cart');
    this.promoInput = page.getByTestId('promo-input');
    this.promoApplyButton = page.getByTestId('promo-apply');
    this.checkoutButton = page.getByTestId('checkout-button');
  }

  async open() {
    await this.page.goto('/cart');
  }

  async enterQuantity(qty) {
    await this.qtyInput.fill(qty);
    await this.qtyInput.press('Tab'); // кошик оновиться, коли користувач завершив зміну поля, тобто курсор вийшов з поля.
  }

  async clickRemoveButton() {
    await this.removeButton.click();
  }

  async clickClearCartButton() {
    this.page.once('dialog', (dialog) => dialog.accept()); // підтверджуємо вікно «Очистити кошик?»
    await this.clearCartButton.click();
  }

  async enterPromoCode(code) {
    await this.promoInput.fill(code);
  }

  async clickApplyPromoButton() {
    await this.promoApplyButton.click();
  }

  async clickCheckoutButton() {
    await this.checkoutButton.click();
  }
}
