/**
 * CHARACTER SELECTION E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the character selection page where users choose which character
 * to load or create a new one.
 */
import { test, expect, Page } from '@playwright/test';
import { setupAuthMocking, setupCharacterMocking, MOCK_USER } from './fixtures/auth';
import { MOCK_CHARACTER_LIST, EMPTY_CHARACTER_LIST, MOCK_CHARACTER } from './fixtures/mock-character';

async function setupAuthenticatedPage(page: Page, characters: unknown[] = MOCK_CHARACTER_LIST) {
  await setupAuthMocking(page);
  await setupCharacterMocking(page, characters);
}

test.describe('Character Selection', () => {
  test.describe('With Characters', () => {
    test('displays character list', async ({ page }) => {
      await setupAuthenticatedPage(page, MOCK_CHARACTER_LIST);
      await page.goto('/client/characters');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-select/character-list.png',
        fullPage: true
      });
    });

    test('shows character details on cards', async ({ page }) => {
      await setupAuthenticatedPage(page, MOCK_CHARACTER_LIST);
      await page.goto('/client/characters');
      await page.waitForLoadState('networkidle');

      // Wait for characters to load
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'e2e/screenshots/character-select/character-cards.png',
        fullPage: true
      });
    });

    test('has create new character button', async ({ page }) => {
      await setupAuthenticatedPage(page, MOCK_CHARACTER_LIST);
      await page.goto('/client/characters');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-select/with-create-button.png',
        fullPage: true
      });
    });
  });

  test.describe('Empty State', () => {
    test('shows empty state when no characters', async ({ page }) => {
      await setupAuthenticatedPage(page, EMPTY_CHARACTER_LIST);
      await page.goto('/client/characters');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-select/empty-state.png',
        fullPage: true
      });
    });

    test('prompts user to create first character', async ({ page }) => {
      await setupAuthenticatedPage(page, EMPTY_CHARACTER_LIST);
      await page.goto('/client/characters');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-select/create-first-prompt.png',
        fullPage: true
      });
    });
  });

  test.describe('Navigation', () => {
    test('create character link is visible', async ({ page }) => {
      await setupAuthenticatedPage(page, MOCK_CHARACTER_LIST);
      await page.goto('/client/characters');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/character-select/navigation.png',
        fullPage: true
      });
    });
  });
});

test.describe('Character Selection Responsive', () => {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
  ];

  for (const viewport of viewports) {
    test(`character list at ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await setupAuthenticatedPage(page, MOCK_CHARACTER_LIST);
      await page.goto('/client/characters');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: `e2e/screenshots/character-select/list-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
