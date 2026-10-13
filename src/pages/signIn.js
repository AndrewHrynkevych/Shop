export class SignInPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.getByTestId('input-email');
    this.passwordInput = page.getByTestId('input-password');
    this.submitButton = page.getByTestId('login-submit');
    this.formError = page.getByTestId('login-error');
    this.emailError = page.getByTestId('error-email');
    this.passwordError = page.getByTestId('error-password');
    this.forgotPasswordLink = page.getByTestId('forgot-password-link');
    this.registerLink = page.getByTestId('go-register');
  }

  async open() {
    await this.page.goto('/login');
  }

  async enterEmail(email) {
    await this.emailInput.fill(email);
  }

  async enterPassword(password) {
    await this.passwordInput.fill(password);
  }

  async clickSubmitButton() {
    await this.submitButton.click();
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async clickForgotPasswordLink() {
    await this.forgotPasswordLink.click();
  }
}
