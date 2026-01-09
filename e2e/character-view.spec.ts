/**
 * CHARACTER VIEW E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the main character sheet view including vitals, traits,
 * experiences, ancestry/community panels, and class features.
 */
import { test, expect, Page } from '@playwright/test';
import { setupAuthMocking, MOCK_USER } from './fixtures/auth';
import {
  MOCK_CHARACTER,
  MOCK_CHARACTER_CARDS,
  MOCK_CHARACTER_INVENTORY,
  MOCK_RANGER_CHARACTER,
  MOCK_TRANSFORMED_CHARACTER,
} from './fixtures/mock-character';

async function setupCharacterView(page: Page, character = MOCK_CHARACTER) {
  await setupAuthMocking(page);

  // Mock character fetch
  await page.route('**/rest/v1/characters**', async (route) => {
    const url = route.request().url();
    if (url.includes('id=eq.')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([character]),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([character]),
      });
    }
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

  // Mock relationships
  await page.route('**/rest/v1/character_relationships**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Mock projects
  await page.route('**/rest/v1/character_projects**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

test.describe('Character View - Overview', () => {
  test('displays character header with name and class', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/header.png',
      fullPage: true
    });
  });

  test('shows social profile section', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/social-profile.png',
      fullPage: true
    });
  });

  test('displays level and class badge', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/level-class-badge.png'
    });
  });
});

test.describe('Character View - Vitals Section', () => {
  test('displays HP track', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/vitals-hp.png',
      fullPage: true
    });
  });

  test('displays Stress track', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/vitals-stress.png',
      fullPage: true
    });
  });

  test('displays Armor with damage thresholds', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/vitals-armor.png',
      fullPage: true
    });
  });

  test('displays Evasion stat', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/vitals-evasion.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Traits Section', () => {
  test('displays all 6 traits', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/traits-all.png',
      fullPage: true
    });
  });

  test('shows trait values with modifiers', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/traits-values.png',
      fullPage: true
    });
  });

  test('shows marked trait indicator', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/traits-marked.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Experiences Section', () => {
  test('displays experiences with modifiers', async ({ page }) => {
    await setupCharacterView(page);
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
  test('displays ancestry panel', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/ancestry-panel.png',
      fullPage: true
    });
  });

  test('displays community panel', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/community-panel.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Class Features', () => {
  test('displays class features section', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/class-features.png',
      fullPage: true
    });
  });

  test('displays subclass features', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/subclass-features.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Tabs', () => {
  test('shows Stats tab by default', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/tab-stats.png',
      fullPage: true
    });
  });

  test('Gallery tab is accessible', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/tab-gallery-link.png',
      fullPage: true
    });
  });

  test('Lore tab is accessible', async ({ page }) => {
    await setupCharacterView(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/tab-lore-link.png',
      fullPage: true
    });
  });
});

test.describe('Character View - Special Classes', () => {
  test('Ranger with companion shows companion card', async ({ page }) => {
    await setupCharacterView(page, MOCK_RANGER_CHARACTER);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/ranger-companion.png',
      fullPage: true
    });
  });

  test('Character with transformation shows transformation panel', async ({ page }) => {
    await setupCharacterView(page, MOCK_TRANSFORMED_CHARACTER);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: 'e2e/screenshots/character-view/transformation.png',
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
      await setupCharacterView(page);
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
