export class AccountPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.getByTestId('input-name');
    this.phoneInput = page.getByTestId('input-phone');
    this.profileEmail = page.getByTestId('profile-email');
    this.saveButton = page.getByTestId('profile-save');
    this.ordersTab = page.getByTestId('account-orders-tab');
  }

  async open() {
    await this.page.goto('/account');
  }

  async enterName(name) {
    await this.nameInput.fill(name);
  }

  async enterPhone(phone) {
    await this.phoneInput.fill(phone);
  }

  async clickSaveButton() {
    await this.saveButton.click();
  }

  async clickOrdersTab() {
    await this.ordersTab.click();
  }
}
