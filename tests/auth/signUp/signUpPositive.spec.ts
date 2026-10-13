import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { SignUpPage } from '../../../src/pages/signUp';


test.beforeEach(async ({ page, request }) => {
  await request.post('/api/test/reset');
  await new SignUpPage(page).open();
});

test('sign up with valid credential',  async ({ page }) => {
  const signUpPage = new SignUpPage(page);
  const name = faker.person.firstName();
  const email = faker.internet.email();
  const password = faker.internet.password({ length: 12 }) + 'a1';

  await signUpPage.enterName(name);
  await signUpPage.enterEmail(email);
  await signUpPage.enterPassword(password);
  await signUpPage.confirmPassword(password);
  await signUpPage.checkTermCheckbox();
  await signUpPage.clickSubmitButton();

  await expect(page.getByTestId('flash-message')).toContainText('Реєстрація успішна! Ласкаво просимо.');
  await expect(page).toHaveURL('/account');
});
