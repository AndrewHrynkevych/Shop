import { test, expect } from '@playwright/test';
import {faker} from '@faker-js/faker';
import {SignUpPage } from '../../../src/pages/signUp';

test.describe('SignUpNegative', () => {
  let signUpPage;
    let name;
    let email;
    let password;
  test.beforeEach(async ({ page }) => {
    signUpPage = new SignUpPage(page);
    name = faker.person.firstName();
    email = faker.internet.email();
    password = faker.internet.password();
    await signUpPage.open();
  });

  test('show validation for empty register fields', async ({ page }) => {
    await signUpPage.clickSubmitButton();

    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('error-name')).toContainText("Ім'я має містити щонайменше 2 символи");
    await expect(page.getByTestId('error-email')).toContainText('Вкажіть коректний email');
    await expect(page.getByTestId('error-password')).toContainText('Пароль: мінімум 8 символів, літери та цифри');
  });

  test('show validation for different entered passwords', async ({ page }) => {
    await signUpPage.enterName(name);
    await signUpPage.enterEmail(email);
    await signUpPage.enterPassword('Password123');
    await signUpPage.confirmPassword('Password1234');
    await signUpPage.checkTermCheckbox();
    await signUpPage.clickSubmitButton();
  });

  test('show error when email has already registered', async ({ page }) => {
    await signUpPage.enterName(name);
    await signUpPage.enterEmail('user@shop.test');
    await signUpPage.enterPassword(password);
    await signUpPage.confirmPassword(password);
    await signUpPage.checkTermCheckbox();
    await signUpPage.clickSubmitButton();

    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('error-email')).toHaveText('Користувач з таким email вже існує');
  });

  test('show validation error when email doesn`t meet requirements', async ({ page }) => {
    // домен після крапки має містити щонайменше 2 символи
    await signUpPage.enterName(name);
    await signUpPage.enterEmail('newuser@shop.t');
    await signUpPage.enterPassword(password);
    await signUpPage.confirmPassword(password);
    await signUpPage.checkTermCheckbox();
    await signUpPage.clickSubmitButton();

    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('error-email')).toHaveText('Вкажіть коректний email');
  });

  test('show validation error when name has less than 2 symbols', async ({ page }) => {
    await await signUpPage.enterName('T');
    await signUpPage.enterEmail(email);
    await signUpPage.enterPassword(password);
    await signUpPage.confirmPassword(password);
    await signUpPage.checkTermCheckbox();
    await signUpPage.clickSubmitButton();

    await expect(page).toHaveURL('/register');
    await expect(page.getByTestId('error-name')).toHaveText("Ім'я має містити щонайменше 2 символи");
  });
});
