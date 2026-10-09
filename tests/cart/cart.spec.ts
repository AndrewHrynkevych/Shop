test.describe('Cart', () => {
  test('should recalculate total when quantity changes', ...);
  test('should remove item from cart', ...);
  test('should not allow quantity above available stock', ...);
  test('should keep cart after page reload', ...);
  test('should merge guest cart with user cart after login', ...);
});

test.describe('Promo codes', () => {
  test('should apply valid promo code', ...);
  test('should reject invalid promo code', ...);
  test('should reject expired promo code', ...);
  test('should reject promo code below minimum order amount', ...);
});