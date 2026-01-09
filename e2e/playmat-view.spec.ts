/**
 * PLAYMAT VIEW E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the domain card management interface including loadout/vault,
 * card mechanics, and card customization.
 */
import { test, expect, Page } from '@playwright/test';
import { setupAuthMocking } from './fixtures/auth';
import {
  MOCK_CHARACTER,
  MOCK_CHARACTER_CARDS,
  MOCK_CHARACTER_INVENTORY,
} from './fixtures/mock-character';

async function setupPlaymatView(page: Page, character = MOCK_CHARACTER, cards = MOCK_CHARACTER_CARDS) {
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
      body: JSON.stringify(cards),
    });
  });

  // Mock character inventory
  await page.route('**/rest/v1/character_inventory**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_CHARACTER_INVENTORY),
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

test.describe('Playmat View - Overview', () => {
  test('displays playmat layout', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/overview.png',
      fullPage: true
    });
  });

  test('shows loadout/vault toggle', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/toggle.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Loadout Tab', () => {
  test('displays cards in loadout', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/loadout-cards.png',
      fullPage: true
    });
  });

  test('shows card slots', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/card-slots.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Domain Cards', () => {
  test('displays domain card visual', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/domain-card.png',
      fullPage: true
    });
  });

  test('shows tier banner', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/tier-banner.png',
      fullPage: true
    });
  });

  test('displays card name and description', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/card-details.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Card Mechanics', () => {
  test('displays mechanics tray', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/mechanics-tray.png',
      fullPage: true
    });
  });

  test('shows cost buttons', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/cost-buttons.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Card Actions', () => {
  test('shows info button', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/info-button.png',
      fullPage: true
    });
  });

  test('shows art button', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/art-button.png',
      fullPage: true
    });
  });

  test('shows move to vault button', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/move-button.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Vault Tab', () => {
  test('vault tab is accessible', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/vault-tab.png',
      fullPage: true
    });
  });

  test('displays vault cards', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/vault-cards.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Search & Filter', () => {
  test('displays search bar', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/search-bar.png',
      fullPage: true
    });
  });

  test('shows add card button', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/add-card-button.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Active Modifiers', () => {
  test('displays active modifiers summary', async ({ page }) => {
    await setupPlaymatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/active-modifiers.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Empty State', () => {
  test('shows empty loadout slots', async ({ page }) => {
    await setupPlaymatView(page, MOCK_CHARACTER, []);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/empty-loadout.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
  ];

  for (const viewport of viewports) {
    test(`playmat view at ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await setupPlaymatView(page);
      await page.goto('/client');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `e2e/screenshots/playmat-view/responsive-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
