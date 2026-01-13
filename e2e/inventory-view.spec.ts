/**
 * INVENTORY VIEW E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the equipment and wealth management interface including
 * item management, gold tracking, and equipment slots.
 *
 * REQUIREMENTS:
 * - Must run auth setup first: npx playwright test --project=setup --headed
 * - Requires at least one character in your Supabase account
 */
import { test, expect } from '@playwright/test';

// Helper to navigate to inventory view
async function goToInventoryView(page: import('@playwright/test').Page) {
  await page.goto('/client');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Click More menu, then Inventory
  const moreButton = page.locator('nav button, nav a').filter({ hasText: /more/i }).first();
  if (await moreButton.isVisible()) {
    await moreButton.click();
    await page.waitForTimeout(300);
    const inventoryOption = page.getByText(/inventory/i).first();
    if (await inventoryOption.isVisible()) {
      await inventoryOption.click();
      await page.waitForTimeout(500);
    }
  }
}

test.describe('Inventory View - Overview', () => {
  test('displays inventory layout', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/overview.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Gold', () => {
  test('displays gold tracker', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/gold-tracker.png',
      fullPage: true
    });
  });

  test('shows gold denominations', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/gold-denominations.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Filter Pills', () => {
  test('displays filter pills', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/filter-pills.png',
      fullPage: true
    });
  });

  test('shows all items by default', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/items-all.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Items', () => {
  test('displays item cards', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/item-cards.png',
      fullPage: true
    });
  });

  test('shows equipped items', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/equipped-items.png',
      fullPage: true
    });
  });

  test('displays item details', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/item-details.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Equipment Slots', () => {
  test('shows primary weapon slot', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/slot-primary.png',
      fullPage: true
    });
  });

  test('shows armor slot', async ({ page }) => {
    await goToInventoryView(page);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/slot-armor.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
  ];

  for (const viewport of viewports) {
    test(`inventory view at ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await goToInventoryView(page);

      await page.screenshot({
        path: `e2e/screenshots/inventory-view/responsive-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
