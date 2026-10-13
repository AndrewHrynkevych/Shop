export class ProductPage {
  constructor(page) {
    this.page = page;
    this.productTitle = page.getByTestId('product-title');
    this.breadcrumbs = page.getByTestId('breadcrumbs');
    // на сторінці є ще кнопки add-to-cart у «Схожих товарах», тому шукаємо в блоці товару
    this.productDetails = page.getByTestId('product-details');
    this.stockStatus = this.productDetails.getByTestId('stock-status');
    this.addToCartButton = this.productDetails.getByTestId('add-to-cart');
    this.outOfStockButton = this.productDetails.getByTestId('out-of-stock');
  }

  async open(id) {
    await this.page.goto(`/product/${id}`);
  }

  async clickAddToCart() {
    await this.addToCartButton.click();
  }

  async clickBreadcrumb(name) {
    await this.breadcrumbs.getByRole('link', { name }).click();
  }
}
