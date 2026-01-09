/**
 * INVENTORY VIEW E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the equipment and wealth management interface including
 * item management, gold tracking, and equipment slots.
 */
import { test, expect, Page } from '@playwright/test';
import { setupAuthMocking } from './fixtures/auth';
import {
  MOCK_CHARACTER,
  MOCK_CHARACTER_CARDS,
  MOCK_CHARACTER_INVENTORY,
} from './fixtures/mock-character';

async function setupInventoryView(page: Page, character = MOCK_CHARACTER, inventory = MOCK_CHARACTER_INVENTORY) {
  await setupAuthMocking(page);

  // Mock character fetch
  await page.route('**/rest/v1/characters**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([character]),
    });
  });

  // Mock character cards
  await page.route('**/rest/v1/character_cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CHARACTER_CARDS),
    });
  });

  // Mock character inventory
  await page.route('**/rest/v1/character_inventory**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(inventory),
    });
  });

  // Mock other endpoints
  await page.route('**/rest/v1/character_relationships**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.route('**/rest/v1/character_projects**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
}

test.describe('Inventory View - Overview', () => {
  test('displays inventory layout', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/overview.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Gold Tracker', () => {
  test('displays gold tracker panel', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/gold-tracker.png',
      fullPage: true
    });
  });

  test('shows handfuls/bags/chests', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/gold-denominations.png',
      fullPage: true
    });
  });

  test('displays +/- buttons for gold', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/gold-buttons.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Filter Pills', () => {
  test('displays filter pills', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/filter-pills.png',
      fullPage: true
    });
  });

  test('shows All/Weapons/Armor/Consumables filters', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/filter-categories.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Item Cards', () => {
  test('displays item list', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/item-list.png',
      fullPage: true
    });
  });

  test('shows equipped item badges', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/equipped-badges.png',
      fullPage: true
    });
  });

  test('displays item type indicators', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/item-types.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Weapon Items', () => {
  test('displays weapon cards', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/weapons.png',
      fullPage: true
    });
  });

  test('shows weapon stats', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/weapon-stats.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Armor Items', () => {
  test('displays armor cards', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/armor.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Consumables', () => {
  test('displays consumable items', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/consumables.png',
      fullPage: true
    });
  });

  test('shows quantity for stackable items', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/item-quantity.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Item Actions', () => {
  test('shows info button on items', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/item-info-button.png',
      fullPage: true
    });
  });

  test('shows settings button on items', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/item-settings-button.png',
      fullPage: true
    });
  });

  test('displays equip controls', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/equip-controls.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Add Item', () => {
  test('shows add item button', async ({ page }) => {
    await setupInventoryView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/add-item-button.png',
      fullPage: true
    });
  });
});

test.describe('Inventory View - Empty State', () => {
  test('shows empty inventory message', async ({ page }) => {
    await setupInventoryView(page, MOCK_CHARACTER, []);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/inventory-view/empty-state.png',
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
      await setupInventoryView(page);
      await page.goto('/client');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `e2e/screenshots/inventory-view/responsive-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
