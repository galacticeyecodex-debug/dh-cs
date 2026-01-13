/**
 * PLAYMAT VIEW E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the domain card management interface including loadout/vault,
 * card mechanics, and card customization.
 *
 * REQUIREMENTS:
 * - Must run auth setup first: npx playwright test --project=setup --headed
 * - Requires at least one character in your Supabase account
 */
import { test, expect } from '@playwright/test';

// Helper to navigate to playmat view
async function goToPlaymatView(page: import('@playwright/test').Page) {
  await page.goto('/client');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Click playmat tab in navigation
  const playmatTab = page.locator('nav button, nav a').filter({ hasText: /playmat|cards/i }).first();
  if (await playmatTab.isVisible()) {
    await playmatTab.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Playmat View - Overview', () => {
  test('displays playmat layout', async ({ page }) => {
    await goToPlaymatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/overview.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Loadout/Vault Toggle', () => {
  test('shows loadout by default', async ({ page }) => {
    await goToPlaymatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/loadout.png',
      fullPage: true
    });
  });

  test('can switch to vault', async ({ page }) => {
    await goToPlaymatView(page);

    // Click vault toggle
    const vaultToggle = page.getByText(/vault/i).first();
    if (await vaultToggle.isVisible()) {
      await vaultToggle.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/vault.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Domain Cards', () => {
  test('displays domain card thumbnails', async ({ page }) => {
    await goToPlaymatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/card-thumbnails.png',
      fullPage: true
    });
  });

  test('shows card details', async ({ page }) => {
    await goToPlaymatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/card-details.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Active Modifiers', () => {
  test('displays active modifiers summary', async ({ page }) => {
    await goToPlaymatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/active-modifiers.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Card Mechanics', () => {
  test('shows mechanics tray on card', async ({ page }) => {
    await goToPlaymatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/mechanics-tray.png',
      fullPage: true
    });
  });

  test('shows cost buttons', async ({ page }) => {
    await goToPlaymatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/cost-buttons.png',
      fullPage: true
    });
  });
});

test.describe('Playmat View - Search', () => {
  test('displays search input', async ({ page }) => {
    await goToPlaymatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/playmat-view/search.png',
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
      await goToPlaymatView(page);

      await page.screenshot({
        path: `e2e/screenshots/playmat-view/responsive-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
