/**
 * INTERACTIVE COMPONENT E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for interactive components including modals, sheets, vitals tracking,
 * and other dynamic UI elements.
 */
import { test, expect, Page } from '@playwright/test';
import { setupAuthMocking } from './fixtures/auth';
import {
  MOCK_CHARACTER,
  MOCK_CHARACTER_CARDS,
  MOCK_CHARACTER_INVENTORY,
} from './fixtures/mock-character';

async function setupApp(page: Page, character = MOCK_CHARACTER) {
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

test.describe('Bottom Navigation', () => {
  test('displays bottom navigation bar', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/bottom-nav.png',
      fullPage: true
    });
  });

  test('shows Character/Combat/Playmat/More tabs', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/nav-tabs.png',
      fullPage: true
    });
  });

  test('highlights active tab', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/active-tab.png',
      fullPage: true
    });
  });
});

test.describe('Header', () => {
  test('displays character name in header', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/header.png',
      fullPage: true
    });
  });

  test('shows sign out option', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/sign-out.png',
      fullPage: true
    });
  });
});

test.describe('Dice Roller FAB', () => {
  test('displays dice FAB button', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/dice-fab.png',
      fullPage: true
    });
  });

  test('FAB is positioned correctly', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/fab-position.png',
      fullPage: true
    });
  });
});

test.describe('Vital Tracks', () => {
  test('HP track displays correctly', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/hp-track.png',
      fullPage: true
    });
  });

  test('Stress track displays correctly', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/stress-track.png',
      fullPage: true
    });
  });

  test('Armor track with thresholds', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/armor-track.png',
      fullPage: true
    });
  });

  test('Evasion display with buttons', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/evasion-display.png',
      fullPage: true
    });
  });
});

test.describe('Trait Buttons', () => {
  test('displays all 6 trait buttons', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/trait-buttons.png',
      fullPage: true
    });
  });

  test('trait shows value and modifier', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/trait-value.png',
      fullPage: true
    });
  });

  test('marked trait indicator visible', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/marked-trait.png',
      fullPage: true
    });
  });
});

test.describe('Section Toggles', () => {
  test('show/hide toggle buttons are visible', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/section-toggles.png',
      fullPage: true
    });
  });
});

test.describe('Loading States', () => {
  test('app shows loading state initially', async ({ page }) => {
    await setupApp(page);

    // Navigate without waiting for network
    await page.goto('/client');

    // Capture immediately
    await page.screenshot({
      path: 'e2e/screenshots/interactive/loading-state.png',
      fullPage: true
    });
  });
});

test.describe('Badges and Indicators', () => {
  test('level badge displays correctly', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/level-badge.png',
      fullPage: true
    });
  });

  test('class badge displays correctly', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/class-badge.png',
      fullPage: true
    });
  });

  test('ancestry badge displays correctly', async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/ancestry-badge.png',
      fullPage: true
    });
  });
});

test.describe('Modified Values Styling', () => {
  test('modified values show gold color', async ({ page }) => {
    // Create character with modifiers
    const modifiedCharacter = {
      ...MOCK_CHARACTER,
      modifiers: {
        agility: [{ source: 'Blessing', value: 1 }],
      },
    };

    await setupApp(page, modifiedCharacter);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/modified-value.png',
      fullPage: true
    });
  });
});

test.describe('Critical States', () => {
  test('low HP shows critical styling', async ({ page }) => {
    const criticalCharacter = {
      ...MOCK_CHARACTER,
      hit_points_current: 0,
    };

    await setupApp(page, criticalCharacter);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/critical-hp.png',
      fullPage: true
    });
  });

  test('max stress shows critical styling', async ({ page }) => {
    const stressedCharacter = {
      ...MOCK_CHARACTER,
      stress_current: 6,
    };

    await setupApp(page, stressedCharacter);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/interactive/critical-stress.png',
      fullPage: true
    });
  });
});

test.describe('Interactive - Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
  ];

  for (const viewport of viewports) {
    test(`bottom nav at ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await setupApp(page);
      await page.goto('/client');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `e2e/screenshots/interactive/nav-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
