/**
 * PLAYWRIGHT CONFIGURATION
 * ----------------------------------------------------------------------------
 * Configuration for visual browser testing of the Daggerheart Character Sheet.
 * Used for autonomous development workflow where Claude can:
 * 1. Start the dev server
 * 2. Open browser and navigate
 * 3. Take screenshots for visual verification
 * 4. Iterate on fixes if issues found
 *
 * Visual Regression Testing:
 * - Use `npm run e2e -- --update-snapshots` to create/update baseline screenshots
 * - Use `npm run e2e` to compare against baselines
 * - Snapshots stored in e2e/snapshots/
 */
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  // Snapshot configuration for visual regression
  snapshotDir: './e2e/snapshots',
  snapshotPathTemplate: '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',

  // Expect configuration
  expect: {
    // Timeout for assertions
    timeout: 10000,
    // Visual comparison options
    toHaveScreenshot: {
      // Allow small pixel differences (anti-aliasing, etc.)
      maxDiffPixelRatio: 0.01,
      // Threshold for color difference (0-1)
      threshold: 0.2,
    },
    toMatchSnapshot: {
      // Allow small pixel differences
      maxDiffPixelRatio: 0.01,
    },
  },

  use: {
    // Base URL for the dev server
    baseURL: 'http://localhost:3000',

    // Capture screenshots on failure
    screenshot: 'only-on-failure',

    // Capture trace on first retry
    trace: 'on-first-retry',

    // Mobile-first viewport (matches app design)
    viewport: { width: 390, height: 844 },

    // Consistent rendering for visual tests
    colorScheme: 'dark',

    // Disable animations for consistent screenshots
    // (uncomment if needed for visual regression)
    // launchOptions: {
    //   slowMo: 0,
    // },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Mini'],
      },
    },
  ],

  // Run the dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes to start
  },
});
