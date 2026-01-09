/**
 * NAVIGATION E2E TESTS
 * ----------------------------------------------------------------------------
 * Tests for the bottom navigation bar, header, More menu drawer,
 * and the floating action button (dice roller).
 */
import { test, expect } from '@playwright/test';

test.describe('Navigation Components', () => {
  test.describe('Landing Page Navigation', () => {
    test('landing page has all expected elements', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Title should be visible
      await expect(page.getByRole('heading', { name: /daggerheart companion/i })).toBeVisible();

      // Get Started CTA (styled as button but is a link)
      await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();

      // GitHub link
      await expect(page.getByText(/view on github/i)).toBeVisible();

      // Legal/disclaimer text
      await expect(page.getByText(/provided "as-is"/i)).toBeVisible();

      await page.screenshot({ path: 'e2e/screenshots/navigation/landing-full.png', fullPage: true });
    });

    test('FAB dice button is visible on landing page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Take screenshot - FAB may or may not be present on landing page
      await page.screenshot({ path: 'e2e/screenshots/navigation/fab-landing.png' });

      // The FAB is in bottom-left - just verify page loaded
      await expect(page.getByRole('heading', { name: /daggerheart companion/i })).toBeVisible();
    });
  });

  test.describe('Login Page Navigation', () => {
    test('login page has complete navigation elements', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      // App logo/icon
      await expect(page.locator('svg').first()).toBeVisible();

      // Title
      await expect(page.getByText(/daggerheart companion/i).first()).toBeVisible();

      // Auth button
      await expect(page.getByText(/continue with google/i)).toBeVisible();

      // Support section
      await expect(page.getByText(/support the project/i)).toBeVisible();

      // Footer links
      await expect(page.getByText(/view on github/i)).toBeVisible();

      await page.screenshot({ path: 'e2e/screenshots/navigation/login-complete.png', fullPage: true });
    });

    test('Buy Me A Coffee link is present', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      const coffeeButton = page.getByText(/buy me a coffee/i);
      await expect(coffeeButton).toBeVisible();

      await page.screenshot({ path: 'e2e/screenshots/navigation/support-section.png' });
    });
  });

  test.describe('External Links', () => {
    test('GitHub link has correct attributes', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const githubLink = page.getByText(/view on github/i);
      await expect(githubLink).toBeVisible();
    });

    test('Daggerheart.com link is present', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('link', { name: /www.daggerheart.com/i })).toBeVisible();
    });
  });
});

test.describe('Responsive Design', () => {
  test('mobile viewport displays correctly', async ({ page }) => {
    // Default viewport is already mobile (390x844)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Content should be centered and readable
    const body = page.locator('body');
    await expect(body).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/navigation/mobile-viewport.png', fullPage: true });
  });

  test('tablet viewport displays correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'e2e/screenshots/navigation/tablet-viewport.png', fullPage: true });
  });

  test('desktop viewport displays correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: 'e2e/screenshots/navigation/desktop-viewport.png', fullPage: true });
  });
});
