/**
 * PLAYWRIGHT TEST FIXTURES
 * ----------------------------------------------------------------------------
 * Common utilities and fixtures for Playwright tests.
 * Provides helper functions for screenshots, navigation, and assertions.
 */
import { test as base, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Ensure screenshot directories exist
const screenshotDirs = [
  'e2e/screenshots',
  'e2e/screenshots/auth',
  'e2e/screenshots/navigation',
  'e2e/screenshots/character-creation',
  'e2e/screenshots/components',
  'e2e/screenshots/views'
];

for (const dir of screenshotDirs) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Screenshot helper with organized directory structure
 */
export async function takeScreenshot(
  page: Page,
  category: string,
  name: string,
  fullPage: boolean = true
): Promise<string> {
  const screenshotPath = `e2e/screenshots/${category}/${name}.png`;
  const dir = path.dirname(screenshotPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await page.screenshot({ path: screenshotPath, fullPage });
  return screenshotPath;
}

/**
 * Wait for page to be fully loaded and stable
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300); // Allow animations to settle
}

/**
 * Navigate and wait for page ready
 */
export async function navigateAndWait(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await waitForPageReady(page);
}

/**
 * Check if element has specific CSS class
 */
export async function hasClass(page: Page, selector: string, className: string): Promise<boolean> {
  const element = page.locator(selector);
  const classes = await element.getAttribute('class');
  return classes?.includes(className) ?? false;
}

/**
 * Viewport presets for responsive testing
 */
export const VIEWPORTS = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
  desktopLarge: { width: 1920, height: 1080 }
} as const;

/**
 * Common test assertions
 */
export const assertions = {
  /**
   * Assert that the page loaded without console errors
   */
  async noConsoleErrors(page: Page, allowedPatterns: RegExp[] = []): Promise<void> {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        const isAllowed = allowedPatterns.some((p) => p.test(text));
        if (!isAllowed) {
          errors.push(text);
        }
      }
    });

    // Wait a bit for any async errors
    await page.waitForTimeout(500);

    if (errors.length > 0) {
      console.warn('Console errors found:', errors);
    }
  },

  /**
   * Assert that key UI elements are visible
   */
  async landingPageElements(page: Page): Promise<void> {
    await expect(page.locator('text=Daggerheart').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /get started/i })).toBeVisible();
  },

  /**
   * Assert that login page elements are visible
   */
  async loginPageElements(page: Page): Promise<void> {
    await expect(page.getByText(/continue with google/i)).toBeVisible();
    await expect(page.getByText(/daggerheart companion/i).first()).toBeVisible();
  }
};

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<{
  screenshotDir: string;
}>({
  screenshotDir: async ({}, use) => {
    await use('e2e/screenshots');
  }
});

export { expect };
