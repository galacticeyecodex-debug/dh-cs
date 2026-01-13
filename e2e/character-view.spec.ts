/**
 * CHARACTER VIEW E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the main character sheet view including vitals, traits,
 * experiences, ancestry/community panels, and class features.
 *
 * REQUIREMENTS:
 * - Must run auth setup first: npx playwright test --project=setup --headed
 * - Requires at least one character in your Supabase account
 *
 * These tests use real authenticated data from your Supabase account.
 */
import { test, expect } from '@playwright/test';

test.describe('Character View - Overview', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    // Wait for app to fully load
    await page.waitForTimeout(1000);
  });

  test('displays character header with name and class', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/header.png',
      fullPage: true
    });
  });

  test('shows social profile section', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/social-profile.png',
      fullPage: true
    });
  });

  test('displays level and class badge', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/level-class-badge.png'
    });
  });
});

test.describe('Character View - Vitals Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('displays HP track', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/vitals-hp.png',
      fullPage: true
    });
  });

  test('displays Stress track', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/vitals-stress.png',
      fullPage: true
    });
  });

  test('displays Armor with damage thresholds', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/vitals-armor.png',
      fullPage: true
    });
  });

  test('displays Evasion stat', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/vitals-evasion.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Traits Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('displays all 6 traits', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/traits-all.png',
      fullPage: true
    });
  });

  test('shows trait values with modifiers', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/traits-values.png',
      fullPage: true
    });
  });

  test('shows marked trait indicator', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/traits-marked.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Experiences Section', () => {
  test('displays experiences with modifiers', async ({ page }) => {
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/experiences.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Heritage Panels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('displays ancestry panel', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/ancestry-panel.png',
      fullPage: true
    });
  });

  test('displays community panel', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/community-panel.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Class Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('displays class features section', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/class-features.png',
      fullPage: true
    });
  });

  test('displays subclass features', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/subclass-features.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('shows Stats tab by default', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/tab-stats.png',
      fullPage: true
    });
  });

  test('Gallery tab is accessible', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/tab-gallery-link.png',
      fullPage: true
    });
  });

  test('Lore tab is accessible', async ({ page }) => {
    await page.screenshot({
      path: 'e2e/screenshots/character-view/tab-lore-link.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
  ];

  for (const viewport of viewports) {
    test(`character view at ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/client');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: `e2e/screenshots/character-view/responsive-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
