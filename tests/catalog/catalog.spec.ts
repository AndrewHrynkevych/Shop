test.describe('Search', () => {
  test('should find product by exact name', ...);
  test('should find products by partial query', ...);
  test('should show empty state when nothing found', ...);
  test('should handle special characters in query', ...);
});

test.describe('Filters', () => {
  test('should filter products by price range', ...);
  test('should filter products by category', ...);
  test('should apply multiple filters together', ...);
  test('should reset all filters', ...);
});

test.describe('Sorting', () => {
  test('should sort products by price ascending', ...);
  test('should sort products by price descending', ...);
  test('should sort products by newest', ...);
});

test.describe('Product page', () => {
  test('should update price and stock when variant changes', ...);
  test('should disable add to cart for out-of-stock product', ...);
  test('should navigate via breadcrumbs', ...);
});