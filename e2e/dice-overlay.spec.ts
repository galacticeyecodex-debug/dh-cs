/**
 * DICE OVERLAY E2E TESTS
 * ----------------------------------------------------------------------------
 * End-to-end tests for the 3D dice roller overlay component (DiceBox).
 *
 * These tests verify:
 * - Dice overlay opens and closes correctly
 * - Dice pool management (adding, removing, cycling roles)
 * - Modifier controls function correctly
 * - Experience selection works
 * - Visual appearance of the dice overlay
 *
 * NOTE: These tests use real browser APIs, so DiceBox Web Workers and
 * OffscreenCanvas work correctly (unlike unit tests which mock DiceBox).
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

// Helper to open the dice overlay
async function openDiceOverlay(page: Page) {
  // Click the dice FAB button
  const diceFab = page.locator('button').filter({ has: page.locator('svg.lucide-dices') });
  await diceFab.click();

  // Wait for overlay to be visible
  await page.waitForSelector('[data-testid="dice-tray"]', { state: 'visible', timeout: 5000 });
}

test.describe('Dice Overlay', () => {
  test.beforeEach(async ({ page }) => {
    await setupApp(page);
    await page.goto('/client');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test.describe('Opening and Closing', () => {
    test('opens when dice FAB is clicked', async ({ page }) => {
      // Find and click the dice FAB
      const diceFab = page.locator('button').filter({ has: page.locator('svg.lucide-dices') });
      await expect(diceFab).toBeVisible();

      await diceFab.click();

      // Verify overlay is visible
      await expect(page.locator('[data-testid="dice-tray"]')).toBeVisible();
      await expect(page.locator('[data-testid="dice-controls"]')).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/dice/overlay-open.png',
        fullPage: true
      });
    });

    test('closes when close button is clicked', async ({ page }) => {
      await openDiceOverlay(page);

      // Click close button
      const closeButton = page.getByLabel('Close');
      await closeButton.click();

      // Verify overlay is hidden
      await expect(page.locator('[data-testid="dice-controls"]')).not.toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/dice/overlay-closed.png',
        fullPage: true
      });
    });
  });

  test.describe('Dice Pool', () => {
    test('displays default hope and fear dice', async ({ page }) => {
      await openDiceOverlay(page);

      const dicePool = page.locator('[data-testid="dice-pool"]');
      await expect(dicePool).toBeVisible();

      // Check for hope and fear dice
      await expect(dicePool.locator('[data-testid*="die-button-hope-d12"]')).toBeVisible();
      await expect(dicePool.locator('[data-testid*="die-button-fear-d12"]')).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/dice/default-pool.png',
        fullPage: true
      });
    });

    test('adds dice when picker buttons are clicked', async ({ page }) => {
      await openDiceOverlay(page);

      const dicePool = page.locator('[data-testid="dice-pool"]');

      // Count initial dice
      const initialCount = await dicePool.locator('[data-testid^="die-chip-"]').count();

      // Click d8 picker
      await page.locator('[data-testid="add-d8"]').click();

      // Verify a d8 was added
      const newCount = await dicePool.locator('[data-testid^="die-chip-"]').count();
      expect(newCount).toBe(initialCount + 1);

      // Verify the d8 is visible with plus role (default)
      await expect(dicePool.locator('[data-testid*="die-button-plus-d8"]')).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/dice/added-d8.png',
        fullPage: true
      });
    });

    test('cycles die role when clicked', async ({ page }) => {
      await openDiceOverlay(page);

      // Add a d6
      await page.locator('[data-testid="add-d6"]').click();

      const dicePool = page.locator('[data-testid="dice-pool"]');

      // Verify it starts as plus
      let dieButton = dicePool.locator('[data-testid*="die-button-plus-d6"]');
      await expect(dieButton).toBeVisible();

      // Click to cycle to minus
      await dieButton.click();
      await expect(dicePool.locator('[data-testid*="die-button-minus-d6"]')).toBeVisible();

      // Click to cycle to hope
      dieButton = dicePool.locator('[data-testid*="die-button-minus-d6"]');
      await dieButton.click();
      await expect(dicePool.locator('[data-testid*="die-button-hope-d6"]')).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/dice/cycled-role.png',
        fullPage: true
      });
    });

    test('removes die when remove button is clicked', async ({ page }) => {
      await openDiceOverlay(page);

      // Add a d8
      await page.locator('[data-testid="add-d8"]').click();

      const dicePool = page.locator('[data-testid="dice-pool"]');

      // Verify d8 is present
      await expect(dicePool.locator('[data-testid*="die-button-plus-d8"]')).toBeVisible();

      // Find and click the remove button for the d8
      const removeButton = dicePool.locator('[aria-label="Remove plus d8"]');
      await removeButton.click();

      // Verify d8 is gone
      await expect(dicePool.locator('[data-testid*="die-button-plus-d8"]')).not.toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/dice/removed-die.png',
        fullPage: true
      });
    });
  });

  test.describe('Dice Picker', () => {
    test('displays all dice options (d4, d6, d8, d10, d12, d20)', async ({ page }) => {
      await openDiceOverlay(page);

      const dicePicker = page.locator('[data-testid="dice-picker"]');
      await expect(dicePicker).toBeVisible();

      // Check all dice options are present
      for (const sides of [4, 6, 8, 10, 12, 20]) {
        await expect(page.locator(`[data-testid="add-d${sides}"]`)).toBeVisible();
      }

      await page.screenshot({
        path: 'e2e/screenshots/dice/picker-options.png',
        fullPage: true
      });
    });
  });

  test.describe('Modifier Controls', () => {
    test('displays modifier control with initial value', async ({ page }) => {
      await openDiceOverlay(page);

      const modifierControl = page.locator('[data-testid="modifier-control"]');
      await expect(modifierControl).toBeVisible();

      // Check initial value is +0
      const modifierValue = page.locator('[data-testid="modifier-value"]');
      await expect(modifierValue).toHaveText('+0');

      await page.screenshot({
        path: 'e2e/screenshots/dice/modifier-initial.png',
        fullPage: true
      });
    });

    test('increases modifier when + is clicked', async ({ page }) => {
      await openDiceOverlay(page);

      const modifierValue = page.locator('[data-testid="modifier-value"]');
      const increaseButton = page.locator('[data-testid="modifier-increase"]');

      await increaseButton.click();
      await expect(modifierValue).toHaveText('+1');

      await increaseButton.click();
      await expect(modifierValue).toHaveText('+2');

      await page.screenshot({
        path: 'e2e/screenshots/dice/modifier-increased.png',
        fullPage: true
      });
    });

    test('decreases modifier when - is clicked', async ({ page }) => {
      await openDiceOverlay(page);

      const modifierValue = page.locator('[data-testid="modifier-value"]');
      const decreaseButton = page.locator('[data-testid="modifier-decrease"]');

      await decreaseButton.click();
      await expect(modifierValue).toHaveText('-1');

      await page.screenshot({
        path: 'e2e/screenshots/dice/modifier-decreased.png',
        fullPage: true
      });
    });
  });

  test.describe('Roll Button', () => {
    test('roll button is visible and clickable', async ({ page }) => {
      await openDiceOverlay(page);

      const rollButton = page.locator('[data-testid="roll-button"]');
      await expect(rollButton).toBeVisible();
      await expect(rollButton).toHaveText(/ROLL/);

      await page.screenshot({
        path: 'e2e/screenshots/dice/roll-button.png',
        fullPage: true
      });
    });

    test('clicking roll triggers dice animation', async ({ page }) => {
      await openDiceOverlay(page);

      // Wait for DiceBox to be ready
      await page.waitForSelector('[data-testid="dice-ready"]', { timeout: 10000 });

      const rollButton = page.locator('[data-testid="roll-button"]');
      await rollButton.click();

      // Wait a moment for the roll animation to start
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'e2e/screenshots/dice/rolling.png',
        fullPage: true
      });
    });
  });

  test.describe('Roll Results', () => {
    test('displays roll result after rolling', async ({ page }) => {
      await openDiceOverlay(page);

      // Wait for DiceBox to be ready
      await page.waitForSelector('[data-testid="dice-ready"]', { timeout: 10000 });

      const rollButton = page.locator('[data-testid="roll-button"]');
      await rollButton.click();

      // Wait for result to appear
      await page.waitForSelector('[data-testid="roll-result"]', { timeout: 10000 });

      const rollResult = page.locator('[data-testid="roll-result"]');
      await expect(rollResult).toBeVisible();

      // Check that a total is displayed
      const rollTotal = page.locator('[data-testid="roll-total"]');
      await expect(rollTotal).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/dice/roll-result.png',
        fullPage: true
      });
    });

    test('displays roll type (Hope/Fear/Critical)', async ({ page }) => {
      await openDiceOverlay(page);

      // Wait for DiceBox to be ready
      await page.waitForSelector('[data-testid="dice-ready"]', { timeout: 10000 });

      const rollButton = page.locator('[data-testid="roll-button"]');
      await rollButton.click();

      // Wait for result
      await page.waitForSelector('[data-testid="roll-result"]', { timeout: 10000 });

      // Check roll type badge exists
      const rollType = page.locator('[data-testid="roll-type"]');
      await expect(rollType).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/dice/roll-type.png',
        fullPage: true
      });
    });
  });

  test.describe('Experiences Section', () => {
    test('displays experiences when character has them', async ({ page }) => {
      const characterWithExperiences = {
        ...MOCK_CHARACTER,
        experiences: [
          { name: 'Nimble', value: 2 },
          { name: 'Strong', value: 3 },
        ],
      };

      await setupApp(page, characterWithExperiences);
      await page.goto('/client');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await openDiceOverlay(page);

      // Check experiences section is visible
      const experiencesSection = page.locator('[data-testid="experiences-section"]');
      await expect(experiencesSection).toBeVisible();

      // Check experiences are listed
      await expect(page.locator('[data-testid="experience-0"]')).toBeVisible();
      await expect(page.locator('[data-testid="experience-1"]')).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/dice/experiences.png',
        fullPage: true
      });
    });

    test('toggles experience selection on click', async ({ page }) => {
      const characterWithExperiences = {
        ...MOCK_CHARACTER,
        experiences: [{ name: 'Nimble', value: 2 }],
      };

      await setupApp(page, characterWithExperiences);
      await page.goto('/client');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await openDiceOverlay(page);

      const experienceButton = page.locator('[data-testid="experience-0"]');

      // Initially not selected
      await expect(experienceButton).toHaveAttribute('data-selected', 'false');

      // Click to select
      await experienceButton.click();
      await expect(experienceButton).toHaveAttribute('data-selected', 'true');

      await page.screenshot({
        path: 'e2e/screenshots/dice/experience-selected.png',
        fullPage: true
      });

      // Click again to deselect
      await experienceButton.click();
      await expect(experienceButton).toHaveAttribute('data-selected', 'false');
    });
  });

  test.describe('Visual Regression', () => {
    test('dice overlay full view', async ({ page }) => {
      await openDiceOverlay(page);

      // Wait for everything to load
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'e2e/screenshots/dice/overlay-full.png',
        fullPage: true
      });
    });

    test('dice overlay at tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await openDiceOverlay(page);
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'e2e/screenshots/dice/overlay-tablet.png',
        fullPage: true
      });
    });
  });
});
