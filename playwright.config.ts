/**
 * PLAYWRIGHT CONFIGURATION
 * ----------------------------------------------------------------------------
 * Configuration for visual browser testing of the Daggerheart Character Sheet.
 *
 * TEST PROJECTS:
 * - setup: One-time auth setup (run: npx playwright test --project=setup)
 * - public: Tests for public routes (no auth required)
 * - chromium/mobile/tablet: Authenticated tests (require setup first)
 *
 * AUTHENTICATION:
 * Authenticated tests require a saved session. To set up:
 * 1. Create a test user in Supabase with email/password auth
 * 2. Add credentials to .env.local:
 *    E2E_TEST_EMAIL=your-test-email@example.com
 *    E2E_TEST_PASSWORD=your-test-password
 * 3. Run: npx playwright test --project=setup
 * 4. Session is saved to .auth/user.json (gitignored)
 *
 * Visual Regression Testing:
 * - Use `npm run e2e -- --update-snapshots` to create/update baseline screenshots
 * - Use `npm run e2e` to compare against baselines
 * - Snapshots stored in e2e/snapshots/
 */
import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

const authFile = path.join(__dirname, '.auth/user.json');

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
  },

  projects: [
    // === AUTH SETUP PROJECT ===
    // Run manually: npx playwright test --project=setup --headed
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },

    // === PUBLIC TESTS (NO AUTH) ===
    // Tests that verify unauthenticated/public behavior
    {
      name: 'public',
      testMatch: [
        /visual-check\.spec\.ts/,
        /auth\.spec\.ts/,
        /navigation\.spec\.ts/,
        /components\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        // No storageState - runs without authentication
      },
    },

    // === AUTHENTICATED TESTS ===
    // These require running setup first and use real auth/data
    {
      name: 'chromium',
      testIgnore: [
        /auth\.setup\.ts/,
        /visual-check\.spec\.ts/,
        /auth\.spec\.ts/,
        /navigation\.spec\.ts/,
        /components\.spec\.ts/,
      ],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        storageState: authFile,
      },
    },
    {
      name: 'mobile',
      testIgnore: [/auth\.setup\.ts/, /visual-check\.spec\.ts/],
      dependencies: ['setup'],
      use: {
        ...devices['iPhone 14'],
        storageState: authFile,
      },
    },
    {
      name: 'tablet',
      testIgnore: [/auth\.setup\.ts/, /visual-check\.spec\.ts/],
      dependencies: ['setup'],
      use: {
        ...devices['iPad Mini'],
        storageState: authFile,
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
