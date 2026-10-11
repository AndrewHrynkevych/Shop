import { test, expect } from '@playwright/test';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should find product by exact name', async ({ page }) => {
    await page.getByTestId('search-input').fill('Смартфон Nova X1 128 ГБ');
    await page.getByTestId('search-button').click();
    await expect(page).toHaveURL(/\/catalog\?q=.+/);
    await expect(page.getByTestId('results-count')).toHaveText('Знайдено товарів: 1');
    await expect(page.getByTestId('product-name')).toHaveText('Смартфон Nova X1 128 ГБ');
  });

  test('should find products by partial query', async ({ page }) => {
    await page.getByTestId('search-input').fill('nova');
    await page.getByTestId('search-button').click();
    await expect(page.getByTestId('results-count')).toHaveText('Знайдено товарів: 3');
    await expect(page.getByTestId('product-card')).toHaveCount(3);
    await expect(page.getByTestId('product-name')).toContainText(['Nova', 'Nova', 'Nova']);
  });

  test('should show empty state when nothing found', async ({ page }) => {
    await page.getByTestId('search-input').fill('qwertyzzz');
    await page.getByTestId('search-button').click();
    await expect(page.getByTestId('results-count')).toHaveText('Знайдено товарів: 0');
    await expect(page.getByTestId('no-results')).toContainText('За вашим запитом нічого не знайдено.');
    await expect(page.getByTestId('product-card')).toHaveCount(0);
  });

  test('should handle special characters in query', async ({ page }) => {
    await page.getByTestId('search-input').fill('<b>100%</b> & "C++"');
    await page.getByTestId('search-button').click();
    await expect(page.getByTestId('page-title')).toContainText('<b>100%</b> & "C++"');
    await expect(page.getByTestId('search-input')).toHaveValue('<b>100%</b> & "C++"');
    await expect(page.getByTestId('no-results')).toBeVisible();
  });
});

test.describe('Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalog');
  });

  test('should filter products by price range', async ({ page }) => {
    await page.getByTestId('filter-min-price').fill('300');
    await page.getByTestId('filter-max-price').fill('500');
    await page.getByTestId('apply-filters').click();
    await expect(page).toHaveURL(/minPrice=300/);
    await expect(page).toHaveURL(/maxPrice=500/);
    await expect(page.getByTestId('product-card').first()).toBeVisible();
    for (const price of await page.getByTestId('product-price').all()) {
      const value = Number(await price.getAttribute('data-price'));
      expect(value).toBeGreaterThanOrEqual(300);
      expect(value).toBeLessThanOrEqual(500);
    }
  });

  test('should filter products by category', async ({ page }) => {
    await page.getByTestId('filter-category-books').check();
    await page.getByTestId('apply-filters').click();
    await expect(page).toHaveURL(/category=books/);
    await expect(page.getByTestId('results-count')).toHaveText('Знайдено товарів: 10');
    await expect(page.getByTestId('breadcrumbs')).toContainText('Книги');
  });

  test('should apply multiple filters together', async ({ page }) => {
    // книги до 500 грн, які є в наявності: «Кобзар», «Тигролови», «Атомні звички», «Гаррі Поттер…»
    await page.getByTestId('filter-category-books').check();
    await page.getByTestId('filter-max-price').fill('500');
    await page.getByTestId('filter-in-stock').check();
    await page.getByTestId('apply-filters').click();
    await expect(page.getByTestId('results-count')).toHaveText('Знайдено товарів: 4');
    await expect(page.getByTestId('product-card')).toHaveCount(4);
    for (const price of await page.getByTestId('product-price').all()) {
      expect(Number(await price.getAttribute('data-price'))).toBeLessThanOrEqual(500);
    }
  });

  test('should reset all filters', async ({ page }) => {
    await page.getByTestId('filter-category-books').check();
    await page.getByTestId('filter-max-price').fill('500');
    await page.getByTestId('apply-filters').click();
    await expect(page.getByTestId('results-count')).toHaveText('Знайдено товарів: 4');
    await page.getByTestId('reset-filters').click();
    await expect(page).toHaveURL('/catalog');
    await expect(page.getByTestId('results-count')).toHaveText('Знайдено товарів: 50');
    await expect(page.getByTestId('filter-category-all')).toBeChecked();
    await expect(page.getByTestId('filter-max-price')).toHaveValue('');
  });
});

test.describe('Sorting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/catalog');
  });

  test('should sort products by price ascending', async ({ page }) => {
    await page.getByTestId('sort-select').selectOption('price_asc');
    await expect(page).toHaveURL(/sort=price_asc/);
    const prices: number[] = [];
    for (const price of await page.getByTestId('product-price').all()) {
      prices.push(Number(await price.getAttribute('data-price')));
    }
    expect(prices[0]).toBe(249);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('should sort products by price descending', async ({ page }) => {
    await page.getByTestId('sort-select').selectOption('price_desc');
    await expect(page).toHaveURL(/sort=price_desc/);
    const prices: number[] = [];
    for (const price of await page.getByTestId('product-price').all()) {
      prices.push(Number(await price.getAttribute('data-price')));
    }
    expect(prices[0]).toBe(51999);
    expect(prices).toEqual([...prices].sort((a, b) => b - a));
  });

  test('should sort products by newest', async ({ page }) => {
    await page.getByTestId('sort-select').selectOption('newest');
    await expect(page).toHaveURL(/sort=newest/);
    await expect(page.getByTestId('product-name').first()).toHaveText('Еспандер еластичний набір');
    await expect(page.getByTestId('product-name').nth(1)).toHaveText('Ракетка для бадмінтону (пара)');
  });
});

test.describe('Product page', () => {
  // на сайті товари не мають варіантів (розмір, колір, обсяг пам'яті), тому перевіряти нічого
  test.fixme('should update price and stock when variant changes', async ({ page }) => {});

  test('should disable add to cart for out-of-stock product', async ({ page }) => {
    // товар №4 «Навушники накладні Studio 500» — немає в наявності
    await page.goto('/product/4');
    const details = page.getByTestId('product-details');
    await expect(details.getByTestId('stock-status')).toHaveText('Немає в наявності');
    await expect(details.getByTestId('out-of-stock')).toBeDisabled();
    await expect(details.getByTestId('add-to-cart')).toHaveCount(0);
  });

  test('should navigate via breadcrumbs', async ({ page }) => {
    await page.goto('/product/31');
    await expect(page.getByTestId('breadcrumbs')).toContainText('Чиста архітектура');
    await page.getByTestId('breadcrumbs').getByRole('link', { name: 'Книги' }).click();
    await expect(page).toHaveURL('/catalog?category=books');
    await page.getByTestId('breadcrumbs').getByRole('link', { name: 'Головна' }).click();
    await expect(page).toHaveURL('/');
  });
});
