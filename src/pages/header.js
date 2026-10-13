export class Header {
  constructor(page) {
    this.page = page;
    this.searchInput = page.getByTestId('search-input');
    this.searchButton = page.getByTestId('search-button');
    this.cartLink = page.getByTestId('cart-link');
    this.cartCount = page.getByTestId('cart-count');
    this.loginLink = page.getByTestId('login-link');
    this.ordersLink = page.getByTestId('orders-link');
    this.userName = page.getByTestId('user-name');
  }

  async open() {
    await this.page.goto('/');
  }

  async enterSearchQuery(query) {
    await this.searchInput.fill(query);
  }

  async clickSearchButton() {
    await this.searchButton.click();
  }

  async clickCartLink() {
    await this.cartLink.click();
  }

  async clickLoginLink() {
    await this.loginLink.click();
  }

  async clickOrdersLink() {
    await this.ordersLink.click();
  }
}
