export class SignUpPage {
  constructor(page){
    this.page = page;
    this.nameInput = page.getByTestId('input-name');
    this.emailInput = page.getByTestId('input-email');
    this.passwordInput = page.getByTestId('input-password');
    this.confirmPasswordInput = page.getByTestId('input-confirmPassword');
    this.termsCheckbox = page.getByTestId('input-terms');
    this.submitButton = page.getByTestId('register-submit');
  }


  async open() {
    await this.page.goto('/register');
  }

  async enterName(name) {
    await this.nameInput.fill(name);
  }

  async enterEmail(email) {
    await this.emailInput.fill(email);
  }

  async enterPassword(password){
    await this.passwordInput.fill(password);
  }

  async confirmPassword(password){
    await this.confirmPasswordInput.fill(password);
  }

  async checkTermCheckbox(){
    await this.termsCheckbox.check();
  }

  async clickSubmitButton(){
    await this.submitButton.click();
  }
};
