export class CheckoutPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.getByTestId('input-name');
    this.emailInput = page.getByTestId('input-email');
    this.phoneInput = page.getByTestId('input-phone');
    this.courierDelivery = page.getByTestId('delivery-courier');
    this.postDelivery = page.getByTestId('delivery-post');
    this.pickupDelivery = page.getByTestId('delivery-pickup');
    this.cityInput = page.getByTestId('input-city');
    this.addressInput = page.getByTestId('input-address');
    this.postOfficeInput = page.getByTestId('input-postOffice');
    this.storeSelect = page.getByTestId('input-store');
    this.cardPayment = page.getByTestId('payment-card');
    this.cashPayment = page.getByTestId('payment-cash');
    this.cardNumberInput = page.getByTestId('input-cardNumber');
    this.cardExpiryInput = page.getByTestId('input-cardExpiry');
    this.cardCvvInput = page.getByTestId('input-cardCvv');
    this.termsCheckbox = page.getByTestId('input-terms');
    this.placeOrderButton = page.getByTestId('place-order');
    this.backToCartLink = page.getByTestId('back-to-cart');
    this.viewOrderLink = page.getByTestId('view-order');
  }

  async open() {
    await this.page.goto('/checkout');
  }

  async enterName(name) {
    await this.nameInput.fill(name);
  }

  async enterEmail(email) {
    await this.emailInput.fill(email);
  }

  async enterPhone(phone) {
    await this.phoneInput.fill(phone);
  }

  async checkCourierDelivery() {
    await this.courierDelivery.check();
  }

  async checkPostDelivery() {
    await this.postDelivery.check();
  }

  async checkPickupDelivery() {
    await this.pickupDelivery.check();
  }

  async enterCity(city) {
    await this.cityInput.fill(city);
  }

  async enterAddress(address) {
    await this.addressInput.fill(address);
  }

  async enterPostOffice(postOffice) {
    await this.postOfficeInput.fill(postOffice);
  }

  async selectStore(store) {
    await this.storeSelect.selectOption(store);
  }

  async checkCardPayment() {
    await this.cardPayment.check();
  }

  async checkCashPayment() {
    await this.cashPayment.check();
  }

  async enterCardNumber(cardNumber) {
    await this.cardNumberInput.fill(cardNumber);
  }

  async enterCardExpiry(cardExpiry) {
    await this.cardExpiryInput.fill(cardExpiry);
  }

  async enterCardCvv(cardCvv) {
    await this.cardCvvInput.fill(cardCvv);
  }

  async checkTermCheckbox() {
    await this.termsCheckbox.check();
  }

  async clickPlaceOrderButton() {
    await this.placeOrderButton.click();
  }

  async doubleClickPlaceOrderButton() {
    await this.placeOrderButton.dblclick();
  }

  async clickBackToCartLink() {
    await this.backToCartLink.click();
  }

  async clickViewOrderLink() {
    await this.viewOrderLink.click();
  }
}
