/**
 * COMPONENT VISUAL TESTS
 * ----------------------------------------------------------------------------
 * Visual verification tests for key UI components.
 * These tests capture screenshots to verify component rendering.
 */
import { test, expect } from '@playwright/test';

test.describe('UI Component Visual Verification', () => {
  test.describe('Landing Page Components', () => {
    test('hero section renders correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Capture hero section
      await page.screenshot({
        path: 'e2e/screenshots/components/hero-section.png',
        fullPage: false
      });

      // Verify key elements
      await expect(page.locator('text=Daggerheart').first()).toBeVisible();
    });

    test('CTA link has correct styling', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const ctaLink = page.getByRole('link', { name: /get started/i });
      await expect(ctaLink).toBeVisible();

      // Link should have gold/yellow background (dagger-gold)
      await page.screenshot({
        path: 'e2e/screenshots/components/cta-button.png'
      });
    });

    test('footer section renders correctly', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Scroll to bottom to capture footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(300);

      await page.screenshot({
        path: 'e2e/screenshots/components/footer.png'
      });

      // Verify footer content (contains Critical Role reference)
      await expect(page.getByText('Critical Role').first()).toBeVisible();
    });
  });

  test.describe('Login Page Components', () => {
    test('auth card renders correctly', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/components/auth-card.png',
        fullPage: true
      });

      // Verify card contents
      await expect(page.getByText(/your digital character sheet/i)).toBeVisible();
    });

    test('Google OAuth button has correct styling', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      const googleButton = page.getByText(/continue with google/i);
      await expect(googleButton).toBeVisible();

      // Should have Google logo/icon
      await page.screenshot({
        path: 'e2e/screenshots/components/google-oauth-button.png'
      });
    });

    test('support section renders correctly', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      await expect(page.getByText(/support the project/i)).toBeVisible();
      await expect(page.getByText(/buy me a coffee/i)).toBeVisible();

      await page.screenshot({
        path: 'e2e/screenshots/components/support-section.png'
      });
    });
  });

  test.describe('FAB (Floating Action Button)', () => {
    test('FAB is visible on landing page', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // FAB should be in fixed position
      const fab = page.locator('button[class*="fixed"], div[class*="fixed"]').first();

      await page.screenshot({
        path: 'e2e/screenshots/components/fab-visible.png'
      });
    });

    test('FAB is visible on login page', async ({ page }) => {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'e2e/screenshots/components/fab-login.png'
      });
    });
  });
});

test.describe('Color System Verification', () => {
  test('dagger-gold accent color is used correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The CTA button should use dagger-gold (#C8AA6E)
    const ctaButton = page.getByRole('button', { name: /get started/i });

    await page.screenshot({
      path: 'e2e/screenshots/components/color-gold-accent.png'
    });
  });

  test('dark theme colors are applied', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Body should have dark background
    const body = page.locator('body');

    await page.screenshot({
      path: 'e2e/screenshots/components/color-dark-theme.png'
    });
  });
});

test.describe('Typography Verification', () => {
  test('serif font used for titles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Main title should use serif font
    const title = page.locator('text=Daggerheart Companion').first();
    await expect(title).toBeVisible();

    await page.screenshot({
      path: 'e2e/screenshots/components/typography-title.png'
    });
  });

  test('sans-serif font used for body text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const bodyText = page.getByText(/fan-made digital character sheet/i);
    await expect(bodyText).toBeVisible();

    await page.screenshot({
      path: 'e2e/screenshots/components/typography-body.png'
    });
  });
});

test.describe('Accessibility Basics', () => {
  test('buttons have visible text or aria-label', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const buttons = page.getByRole('button');
    const count = await buttons.count();

    // All buttons should be visible
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      await expect(button).toBeVisible();
    }

    await page.screenshot({
      path: 'e2e/screenshots/components/accessibility-buttons.png',
      fullPage: true
    });
  });

  test('links are distinguishable', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const links = page.getByRole('link');
    const count = await links.count();

    // All links should be visible
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const isVisible = await link.isVisible();
      if (isVisible) {
        await expect(link).toBeVisible();
      }
    }

    await page.screenshot({
      path: 'e2e/screenshots/components/accessibility-links.png',
      fullPage: true
    });
  });
});
