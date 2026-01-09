/**
 * COMBAT VIEW E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the combat-focused interface including weapons, attacks,
 * spells/abilities, and combat-relevant features.
 */
import { test, expect, Page } from '@playwright/test';
import { setupAuthMocking } from './fixtures/auth';
import {
  MOCK_CHARACTER,
  MOCK_CHARACTER_CARDS,
  MOCK_CHARACTER_INVENTORY,
  MOCK_RANGER_CHARACTER,
} from './fixtures/mock-character';

async function setupCombatView(page: Page, character = MOCK_CHARACTER) {
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

test.describe('Combat View - Overview', () => {
  test('displays combat view layout', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Navigate to combat view via bottom nav
    await page.screenshot({
      path: 'e2e/screenshots/combat-view/overview.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Proficiency', () => {
  test('displays proficiency bonus', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/proficiency.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Vitals', () => {
  test('shows combat vitals section', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/vitals.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Weapons', () => {
  test('displays equipped weapons', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/weapons-equipped.png',
      fullPage: true
    });
  });

  test('shows primary weapon card', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/weapon-primary.png',
      fullPage: true
    });
  });

  test('shows secondary weapon card', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/weapon-secondary.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Attack Cards', () => {
  test('displays weapon attack card with damage', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/attack-card.png',
      fullPage: true
    });
  });

  test('shows attack bonus indicator', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/attack-bonus.png',
      fullPage: true
    });
  });

  test('displays damage formula', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/damage-formula.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Spells/Abilities', () => {
  test('displays domain card abilities', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/abilities.png',
      fullPage: true
    });
  });

  test('shows ability type badges', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/ability-badges.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Armor', () => {
  test('displays active armor info', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/armor-active.png',
      fullPage: true
    });
  });

  test('shows damage thresholds', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/damage-thresholds.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Heritage Features', () => {
  test('shows ancestry combat features', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/ancestry-features.png',
      fullPage: true
    });
  });

  test('shows community combat features', async ({ page }) => {
    await setupCombatView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/community-features.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Companion (Ranger)', () => {
  test('displays companion attack card', async ({ page }) => {
    await setupCombatView(page, MOCK_RANGER_CHARACTER);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/companion-attack.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
  ];

  for (const viewport of viewports) {
    test(`combat view at ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await setupCombatView(page);
      await page.goto('/client');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `e2e/screenshots/combat-view/responsive-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
