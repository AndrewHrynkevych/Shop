export class PasswordResetPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByTestId('input-email');
    this.sendButton = page.getByTestId('forgot-submit');
    this.mailItem = page.getByTestId('mail-item');
    this.mailResetLink = page.getByTestId('mail-reset-link');
    this.passwordInput = page.getByTestId('input-password');
    this.confirmPasswordInput = page.getByTestId('input-confirmPassword');
    this.submitButton = page.getByTestId('reset-submit');
  }

  async open() {
    await this.page.goto('/forgot-password');
  }

  async openResetLink(link) {
    await this.page.goto(link);
  }

  async openMailbox() {
    await this.page.goto('/mailbox');
  }

  async enterEmail(email) {
    await this.emailInput.fill(email);
  }

  async clickSendButton() {
    await this.sendButton.click();
  }

  async clickMailResetLink() {
    await this.mailResetLink.click();
  }

  async enterPassword(password) {
    await this.passwordInput.fill(password);
  }

  async confirmPassword(password) {
    await this.confirmPasswordInput.fill(password);
  }

  async clickSubmitButton() {
    await this.submitButton.click();
  }
}
