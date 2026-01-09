/**
 * PLAYWRIGHT AUTH FIXTURES
 * ----------------------------------------------------------------------------
 * Provides authenticated page fixtures for testing protected routes.
 * Uses route interception to mock Supabase auth responses.
 */
import { test as baseTest, expect, Page } from '@playwright/test';
import { MOCK_CHARACTER } from './mock-character';

// Mock user data
export const MOCK_USER = {
  id: 'test-user-e2e-12345',
  email: 'test@daggerheart.example.com',
  user_metadata: {
    full_name: 'Test Hero',
    avatar_url: null,
  },
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
  app_metadata: { provider: 'google' },
};

// Mock session data
export const MOCK_SESSION = {
  access_token: 'mock-access-token-e2e-testing',
  refresh_token: 'mock-refresh-token-e2e-testing',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: MOCK_USER,
};

/**
 * Setup auth mocking for a page by intercepting Supabase auth API calls
 */
export async function setupAuthMocking(page: Page): Promise<void> {
  // Intercept Supabase auth user endpoint
  await page.route('**/auth/v1/user', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_USER),
    });
  });

  // Intercept Supabase auth token endpoint
  await page.route('**/auth/v1/token**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SESSION),
    });
  });

  // Intercept user profile fetch
  await page.route('**/rest/v1/user_profiles**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: MOCK_USER.id,
          email: MOCK_USER.email,
          display_name: MOCK_USER.user_metadata.full_name,
          avatar_url: null,
          include_playtest: true,
          include_srd: true,
          created_at: MOCK_USER.created_at,
        }]),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Setup character data mocking
 */
export async function setupCharacterMocking(page: Page, characters: unknown[] = []): Promise<void> {
  // Intercept character list fetch
  await page.route('**/rest/v1/characters**', async (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'GET') {
      // Return character list or single character based on URL
      if (url.includes('select=')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(characters),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(characters),
        });
      }
    } else {
      await route.continue();
    }
  });

  // Intercept character cards fetch
  await page.route('**/rest/v1/character_cards**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Intercept character inventory fetch
  await page.route('**/rest/v1/character_inventory**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

/**
 * Extended test with auth fixtures
 */
export const test = baseTest.extend<{
  authenticatedPage: Page;
  authenticatedPageWithCharacter: Page;
}>({
  // Basic authenticated page (no character loaded)
  authenticatedPage: async ({ page }, use) => {
    await setupAuthMocking(page);
    await setupCharacterMocking(page, []);
    await use(page);
  },

  // Authenticated page with a mock character
  authenticatedPageWithCharacter: async ({ page }, use) => {
    await setupAuthMocking(page);
    await setupCharacterMocking(page, [MOCK_CHARACTER]);
    await use(page);
  },
});

export { expect };
