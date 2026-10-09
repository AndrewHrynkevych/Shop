test.describe('Registration', () => {
  test('should register user with valid data');
  test('show validation for empty register fields');
  test('show error when email has already registered');
  test('show reject invalid email format');
  test('show validation error when email doesn`t meet requirements');
  test('show validation error when name has less than 2 symbols');
});

test.describe('Login', () => {
  test('should log in with valid credentials');
  test('show validation on login when email wasn empty ');
  test('show validation on login when password was empty ');
  test('show validation on login when email was wrong ');
  test('show validation on login when password was wrong ');

});

test.describe('Password reset', () => {
  test('should send reset email for registered user', ...);
  test('should set new password via reset link', ...);
});


test.describe('Profile', () => {
  test('should update personal info');
  test('should able to check purchases');
});
  