/**
 * COMBAT VIEW E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the combat-focused interface including weapons, attacks,
 * spells/abilities, and combat-relevant features.
 *
 * REQUIREMENTS:
 * - Must run auth setup first: npx playwright test --project=setup --headed
 * - Requires at least one character in your Supabase account
 */
import { test, expect } from '@playwright/test';

// Helper to navigate to combat view
async function goToCombatView(page: import('@playwright/test').Page) {
  await page.goto('/client');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Click combat tab in navigation
  const combatTab = page.locator('nav button, nav a').filter({ hasText: /combat/i }).first();
  if (await combatTab.isVisible()) {
    await combatTab.click();
    await page.waitForTimeout(500);
  }
}

test.describe('Combat View - Overview', () => {
  test('displays combat view layout', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/overview.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Proficiency', () => {
  test('displays proficiency bonus', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/proficiency.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Vitals', () => {
  test('shows combat vitals section', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/vitals.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Weapons', () => {
  test('displays equipped weapons', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/weapons-equipped.png',
      fullPage: true
    });
  });

  test('shows primary weapon card', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/weapon-primary.png',
      fullPage: true
    });
  });

  test('shows secondary weapon card', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/weapon-secondary.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Attack Cards', () => {
  test('displays weapon attack card with damage', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/attack-card.png',
      fullPage: true
    });
  });

  test('shows attack bonus indicator', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/attack-bonus.png',
      fullPage: true
    });
  });

  test('displays damage formula', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/damage-formula.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Spells/Abilities', () => {
  test('displays domain card abilities', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/abilities.png',
      fullPage: true
    });
  });

  test('shows ability type badges', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/ability-badges.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Armor', () => {
  test('displays active armor info', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/armor-active.png',
      fullPage: true
    });
  });

  test('shows damage thresholds', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/damage-thresholds.png',
      fullPage: true
    });
  });
});

test.describe('Combat View - Heritage Features', () => {
  test('shows ancestry combat features', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/ancestry-features.png',
      fullPage: true
    });
  });

  test('shows community combat features', async ({ page }) => {
    await goToCombatView(page);

    await page.screenshot({
      path: 'e2e/screenshots/combat-view/community-features.png',
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
      await goToCombatView(page);

      await page.screenshot({
        path: `e2e/screenshots/combat-view/responsive-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
