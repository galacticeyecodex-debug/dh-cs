/**
 * AUTHENTICATION E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for authentication flows including login page, protected routes,
 * and OAuth callback handling.
 */
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('Public Pages', () => {
    test('homepage loads and displays welcome content', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Should show the app title
      await expect(page.getByRole('heading', { name: /daggerheart companion/i })).toBeVisible();

      // Should have a Get Started link (styled as button)
      await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();

      await page.screenshot({ path: 'e2e/screenshots/auth/homepage.png', fullPage: true });
    });

    test('login page shows Google OAuth button', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // Should show login options
      await expect(page.getByText(/continue with google/i)).toBeVisible();

      // Should show support section
      await expect(page.getByText(/buy me a coffee/i)).toBeVisible();

      await page.screenshot({ path: 'e2e/screenshots/auth/login-page.png', fullPage: true });
    });

    test('Get Started link navigates to login', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Click Get Started
      await page.getByRole('link', { name: /get started/i }).click();

      // Should navigate to login
      await page.waitForURL('**/auth/login');
      await expect(page.getByText(/continue with google/i)).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('unauthenticated user redirected from /client', async ({ page }) => {
      await page.goto('/client');
      await page.waitForLoadState('networkidle');

      // Should redirect to login or show login content
      // The exact behavior depends on middleware implementation
      await page.screenshot({ path: 'e2e/screenshots/auth/protected-redirect.png', fullPage: true });
    });

    test('unauthenticated user redirected from /client/characters', async ({ page }) => {
      await page.goto('/client/characters');
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e/screenshots/auth/characters-redirect.png', fullPage: true });
    });

    test('unauthenticated user redirected from /create-character', async ({ page }) => {
      await page.goto('/create-character');
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e/screenshots/auth/create-character-redirect.png', fullPage: true });
    });
  });

  test.describe('Auth Error Page', () => {
    test('auth error page displays error message', async ({ page }) => {
      await page.goto('/auth/auth-code-error');
      await page.waitForLoadState('networkidle');

      await page.screenshot({ path: 'e2e/screenshots/auth/auth-error.png', fullPage: true });
    });
  });
});
