export class OrdersPage {
  constructor(page) {
    this.page = page;
    this.orderRow = page.getByTestId('order-row');
    this.orderStatus = page.getByTestId('order-status');
    this.orderDetailsLink = page.getByTestId('order-details-link');
    this.cancelOrderButton = page.getByTestId('cancel-order');
  }

  async open() {
    await this.page.goto('/account/orders');
  }

  async openOrder(id) {
    await this.page.goto(`/account/orders/${id}`);
  }

  async clickOrderDetailsLink() {
    await this.orderDetailsLink.click();
  }

  async clickCancelOrderButton() {
    this.page.once('dialog', (dialog) => dialog.accept()); // підтверджуємо вікно «Скасувати замовлення?»
    await this.cancelOrderButton.click();
  }
}
