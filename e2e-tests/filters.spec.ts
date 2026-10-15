import { test, expect } from '@playwright/test';

test.describe('Game filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('filters by a category and clears', async ({ page }) => {
    const cards = page.getByTestId('game-card');
    const total = await cards.count();
    const checkbox = page.locator('[data-testid^="filter-category-"]').first();

    await test.step('Select a category', async () => {
      await checkbox.check();
      const visible = await cards.filter({ visible: true }).count();
      expect(visible).toBeGreaterThan(0);
      expect(visible).toBeLessThan(total);
      await expect(page.getByTestId('filter-result-count')).toHaveText(`Showing ${visible} of ${total} games`);
    });

    await test.step('Clear filters', async () => {
      await page.getByTestId('filter-clear').click();
      await expect(cards.filter({ visible: true })).toHaveCount(total);
      await expect(checkbox).not.toBeChecked();
    });
  });

  test('multiple categories widen the results', async ({ page }) => {
    const checkboxes = page.locator('[data-testid^="filter-category-"]');
    const cards = page.getByTestId('game-card').filter({ visible: true });
    await checkboxes.nth(0).check();
    const one = await cards.count();
    await checkboxes.nth(1).check();
    expect(await cards.count()).toBeGreaterThan(one);
  });

  test('filters by publisher', async ({ page }) => {
    const select = page.getByTestId('filter-publisher');
    await select.selectOption({ index: 1 });
    const name = (await select.locator('option:checked').textContent())!.trim();
    const publishers = page.getByTestId('game-card').filter({ visible: true }).getByTestId('game-publisher');
    expect(await publishers.count()).toBeGreaterThan(0);
    for (const text of await publishers.allTextContents()) {
      expect(text.trim()).toBe(name);
    }
  });

  test('combines category and publisher filters', async ({ page }) => {
    const cards = page.getByTestId('game-card').filter({ visible: true });
    const category = page.locator('[data-testid^="filter-category-"]').first();
    await category.check();
    const categoryOnly = await cards.count();
    const categoryName = (await category.locator('xpath=following-sibling::span').textContent())!.trim();

    const select = page.getByTestId('filter-publisher');
    await select.selectOption({ index: 1 });
    const publisherName = (await select.locator('option:checked').textContent())!.trim();

    expect(await cards.count()).toBeLessThanOrEqual(categoryOnly);
    for (const card of await cards.all()) {
      await expect(card.getByTestId('game-category')).toHaveText(categoryName);
      await expect(card.getByTestId('game-publisher')).toHaveText(publisherName);
    }
  });

  test('controls are keyboard operable and reflected in the URL', async ({ page }) => {
    const checkbox = page.locator('[data-testid^="filter-category-"]').first();
    await checkbox.focus();
    await expect(checkbox).toBeFocused();
    await page.keyboard.press('Space');
    await expect(checkbox).toBeChecked();
    await expect(page).toHaveURL(/\?category=\d+/);
    await page.reload();
    await expect(checkbox).toBeChecked();
  });
});
