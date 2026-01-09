/**
 * VISUAL VERIFICATION TESTS
 * ----------------------------------------------------------------------------
 * Comprehensive E2E tests for visual verification of the Daggerheart Character Sheet.
 * These tests navigate to key pages and take screenshots for visual inspection.
 *
 * Usage:
 *   npm run e2e:screenshot           # Run all visual tests
 *   npm run e2e -- --headed          # Run with visible browser
 *   npm run e2e -- --project=mobile  # Run mobile viewport only
 */
import { test, expect } from '@playwright/test';

test.describe('Core Page Visual Verification', () => {
  test('homepage renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify key elements are present
    await expect(page.getByRole('heading', { name: /daggerheart companion/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();

    await page.screenshot({
      path: 'e2e/screenshots/homepage.png',
      fullPage: true
    });
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    // Verify login elements
    await expect(page.getByText(/continue with google/i)).toBeVisible();
    await expect(page.getByText(/daggerheart companion/i).first()).toBeVisible();

    await page.screenshot({
      path: 'e2e/screenshots/login.png',
      fullPage: true
    });
  });

  test('create-character page loads', async ({ page }) => {
    await page.goto('/create-character');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'e2e/screenshots/create-character.png',
      fullPage: true
    });
  });

  test('auth error page renders', async ({ page }) => {
    await page.goto('/auth/auth-code-error');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'e2e/screenshots/auth-error.png',
      fullPage: true
    });
  });
});

test.describe('Viewport Responsive Tests', () => {
  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 800 }
  ];

  for (const viewport of viewports) {
    test(`homepage at ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: `e2e/screenshots/views/homepage-${viewport.name}.png`,
        fullPage: true
      });
    });

    test(`login at ${viewport.name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: `e2e/screenshots/views/login-${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});

test.describe('Interactive Element States', () => {
  test('CTA link hover state', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const ctaLink = page.getByRole('link', { name: /get started/i });

    // Screenshot before hover
    await page.screenshot({
      path: 'e2e/screenshots/components/cta-default.png'
    });

    // Hover and screenshot
    await ctaLink.hover();
    await page.waitForTimeout(200);

    await page.screenshot({
      path: 'e2e/screenshots/components/cta-hover.png'
    });
  });

  test('Google OAuth button hover state', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const googleButton = page.getByText(/continue with google/i);

    // Screenshot before hover
    await page.screenshot({
      path: 'e2e/screenshots/components/google-btn-default.png'
    });

    // Hover and screenshot
    await googleButton.hover();
    await page.waitForTimeout(200);

    await page.screenshot({
      path: 'e2e/screenshots/components/google-btn-hover.png'
    });
  });
});

test.describe('Page Load Performance', () => {
  test('homepage loads within timeout', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Homepage load time: ${loadTime}ms`);

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('login page loads within timeout', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`Login page load time: ${loadTime}ms`);

    // Page should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Error State Verification', () => {
  test('404 page for invalid route', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: 'e2e/screenshots/views/404-page.png',
      fullPage: true
    });
  });
});

test.describe('Quick Screenshot Utility', () => {
  test('capture current state of any page', async ({ page }) => {
    // Change this URL to whatever page you want to verify
    const targetUrl = process.env.SCREENSHOT_URL || '/';

    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `e2e/screenshots/screenshot-${timestamp}.png`,
      fullPage: true
    });

    console.log(`Screenshot saved: e2e/screenshots/screenshot-${timestamp}.png`);
  });
});
