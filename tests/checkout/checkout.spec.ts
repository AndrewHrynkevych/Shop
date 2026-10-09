test.describe('Shipping', () => {
  test('should validate required shipping fields', ...);
  test('should update total for selected delivery method', ...);
});

test.describe('Payment', () => {
  test('should place order with valid card', ...);
  test('should show error for declined card', ...);
  test('should complete payment with 3DS authentication', ...);
  test('should not create duplicate order on double click', ...);
  test('should keep cart when user returns from payment', ...);
});

test.describe('Order confirmation', () => {
  test('should show thank you page with order number', ...);
  test('should send order confirmation email', ...);
});