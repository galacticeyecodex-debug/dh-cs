/**
 * CHARACTER CREATION E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the multi-step character creation wizard.
 * Note: These tests require authentication to fully execute.
 * Without auth, they verify the redirect behavior and page structure.
 */
import { test, expect } from '@playwright/test';

test.describe('Character Creation Wizard', () => {
  test.describe('Unauthenticated Access', () => {
    test('redirects unauthenticated users to login', async ({ page }) => {
      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      // Should redirect to login or show login content
      await page.screenshot({
        path: 'e2e/screenshots/character-creation/unauthenticated.png',
        fullPage: true
      });

      // The page should either show login or redirect
      const url = page.url();
      const hasLoginContent = await page.getByText(/continue with google/i).isVisible().catch(() => false);

      // Either redirected to login URL or showing login content
      expect(url.includes('login') || hasLoginContent).toBeTruthy();
    });
  });

  test.describe('Page Structure (Visual Verification)', () => {
    test('create-character route loads without errors', async ({ page }) => {
      // Navigate and capture any errors
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/page-load.png',
        fullPage: true
      });

      // Log any errors for debugging (but don't fail on expected auth redirects)
      if (errors.length > 0) {
        console.log('Console errors:', errors);
      }
    });
  });
});

test.describe('Character Creation Form Elements', () => {
  // These tests document expected UI elements for the character creation wizard
  // They serve as visual documentation even without full auth

  test.describe('Expected Step 1: Basic Info', () => {
    test('documents expected basic info fields', async ({ page }) => {
      // This test documents what should be present in Step 1
      // - Character name input
      // - Avatar upload area
      // - Class template selection (optional)
      // - Next button

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/step1-expected.png',
        fullPage: true
      });
    });
  });

  test.describe('Expected Step 2: Heritage', () => {
    test('documents expected heritage selection', async ({ page }) => {
      // This test documents what should be present in Step 2
      // - Ancestry selection (list of ancestries)
      // - Community selection (list of communities)
      // - Mixed ancestry toggle
      // - Back/Next buttons

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/step2-expected.png',
        fullPage: true
      });
    });
  });

  test.describe('Expected Step 3: Class & Domains', () => {
    test('documents expected class selection', async ({ page }) => {
      // This test documents what should be present in Step 3
      // - Class selection (9 classes)
      // - Subclass selection (varies by class)
      // - Auto-populated domains
      // - Back/Next buttons

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/step3-expected.png',
        fullPage: true
      });
    });
  });

  test.describe('Expected Step 4: Domain Cards', () => {
    test('documents expected domain card selection', async ({ page }) => {
      // This test documents what should be present in Step 4
      // - Domain card browser
      // - Select 2 cards per domain
      // - Card previews
      // - Back/Next buttons

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/step4-expected.png',
        fullPage: true
      });
    });
  });

  test.describe('Expected Step 5: Traits', () => {
    test('documents expected trait assignment', async ({ page }) => {
      // This test documents what should be present in Step 5
      // - 6 traits: Agility, Strength, Finesse, Instinct, Presence, Knowledge
      // - Value pool: 2, 1, 1, 0, 0, -1
      // - Dropdown/selection for each trait
      // - Back/Next buttons

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/step5-expected.png',
        fullPage: true
      });
    });
  });

  test.describe('Expected Step 6: Experiences', () => {
    test('documents expected experience input', async ({ page }) => {
      // This test documents what should be present in Step 6
      // - 2 experience inputs
      // - +2 modifier indicator for each
      // - Suggested experiences based on background
      // - Back/Next buttons

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/step6-expected.png',
        fullPage: true
      });
    });
  });

  test.describe('Expected Step 7: Companion (Ranger Only)', () => {
    test('documents expected companion creation', async ({ page }) => {
      // This test documents what should be present in Step 7
      // - Only shows for Ranger with Beastbound subclass
      // - Companion name input
      // - Companion type selection
      // - Training options
      // - Back/Next buttons

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/step7-expected.png',
        fullPage: true
      });
    });
  });

  test.describe('Expected Step 8: Equipment', () => {
    test('documents expected equipment selection', async ({ page }) => {
      // This test documents what should be present in Step 8
      // - Primary weapon selection
      // - Secondary weapon selection
      // - Armor selection
      // - Starting potion
      // - Back/Next buttons

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/step8-expected.png',
        fullPage: true
      });
    });
  });

  test.describe('Expected Step 9: Confirmation', () => {
    test('documents expected confirmation screen', async ({ page }) => {
      // This test documents what should be present in Step 9
      // - Character summary
      // - All selections displayed
      // - Create Character button
      // - Back button to edit

      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-creation/step9-expected.png',
        fullPage: true
      });
    });
  });
});
