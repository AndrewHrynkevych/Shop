import { test, expect } from '@playwright/test';
import {faker} from '@faker-js/faker';

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/test/reset');
  await page.goto('/register');
});

test('sign up with valid credential',  async ({ page }) => {
  await page.getByTestId('input-name').fill(faker.person.firstName());
  await page.getByTestId('input-email').fill(faker.internet.email());
  const password = faker.internet.password();
  await page.getByTestId('input-password').fill(password);
  await page.getByTestId('input-confirmPassword').fill(password);
  await page.getByTestId('input-terms').check();
  await page.getByTestId('register-submit').click();
  await expect(page.getByTestId('flash-message')).toContainText('Реєстрація успішна! Ласкаво просимо.');
  await expect(page).toHaveURL('/account');
});