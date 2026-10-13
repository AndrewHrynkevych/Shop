export class CatalogPage {
  constructor(page) {
    this.page = page;
    this.minPriceInput = page.getByTestId('filter-min-price');
    this.maxPriceInput = page.getByTestId('filter-max-price');
    this.booksCategoryCheckbox = page.getByTestId('filter-category-books');
    this.allCategoriesCheckbox = page.getByTestId('filter-category-all');
    this.inStockCheckbox = page.getByTestId('filter-in-stock');
    this.applyFiltersButton = page.getByTestId('apply-filters');
    this.resetFiltersButton = page.getByTestId('reset-filters');
    this.sortSelect = page.getByTestId('sort-select');
    this.resultsCount = page.getByTestId('results-count');
    this.productCard = page.getByTestId('product-card');
    this.productName = page.getByTestId('product-name');
    this.productPrice = page.getByTestId('product-price');
  }

  async open() {
    await this.page.goto('/catalog');
  }

  async enterMinPrice(price) {
    await this.minPriceInput.fill(price);
  }

  async enterMaxPrice(price) {
    await this.maxPriceInput.fill(price);
  }

  async checkBooksCategory() {
    await this.booksCategoryCheckbox.check();
  }

  async checkInStock() {
    await this.inStockCheckbox.check();
  }

  async clickApplyFilters() {
    await this.applyFiltersButton.click();
  }

  async clickResetFilters() {
    await this.resetFiltersButton.click();
  }

  async selectSort(option) {
    await this.sortSelect.selectOption(option);
  }

  async clickProductName() {
    await this.productName.click();
  }

  async getPrices() {
    const prices = [];
    for (const price of await this.productPrice.all()) {
      prices.push(Number(await price.getAttribute('data-price')));
    }
    return prices;
  }
}
