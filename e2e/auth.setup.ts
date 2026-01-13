/**
 * PLAYWRIGHT AUTH SETUP
 * ----------------------------------------------------------------------------
 * This setup script authenticates with a pre-configured test account for E2E tests
 * and ensures a test character exists for the tests to use.
 *
 * SETUP REQUIREMENTS:
 * 1. Create a test user in your Supabase dashboard with email/password auth
 * 2. Add credentials to .env.local:
 *    E2E_TEST_EMAIL=your-test-email@example.com
 *    E2E_TEST_PASSWORD=your-test-password
 * 3. Run: npx playwright test --project=setup
 *
 * After setup, authenticated tests will use the saved session automatically.
 * The session is stored in .auth/user.json (gitignored).
 */
import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '../.auth/user.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E test credentials not found. Please set E2E_TEST_EMAIL and E2E_TEST_PASSWORD in .env.local'
    );
  }

  console.log('\n========================================');
  console.log('E2E AUTHENTICATION');
  console.log('========================================');
  console.log(`Logging in as: ${email}`);
  console.log('========================================\n');

  // Navigate to the app first to establish the page context
  await page.goto('/auth/login');

  // Use page.request which shares cookies with the page context
  // This ensures cookies set by the API are available to the page
  const loginResponse = await page.request.post('/api/auth/e2e-login', {
    data: { email, password },
  });

  if (!loginResponse.ok()) {
    const errorBody = await loginResponse.json();
    throw new Error(`Login failed: ${errorBody.error || loginResponse.statusText()}`);
  }

  const loginResult = await loginResponse.json();
  console.log(`Login successful for user: ${loginResult.user?.email}`);

  // Create or verify test character exists
  console.log('\nSeeding test character...');
  const seedResponse = await page.request.post('/api/e2e/seed-character');

  if (!seedResponse.ok()) {
    const errorBody = await seedResponse.json();
    console.warn(`Warning: Could not seed test character: ${errorBody.error}`);
    // Don't fail setup - character might already exist or library data might be missing
  } else {
    const seedResult = await seedResponse.json();
    console.log(`Test character: ${seedResult.message} (ID: ${seedResult.character_id})`);
  }

  // Navigate to the app - the auth cookies should now be set
  await page.goto('/client');

  // Wait for the page to load
  await page.waitForLoadState('networkidle');

  // Give time for any client-side auth state to settle
  await page.waitForTimeout(2000);

  // Verify we're logged in by checking we're not on the login page
  const currentUrl = page.url();
  if (currentUrl.includes('/auth/login')) {
    throw new Error('Authentication failed - redirected back to login page');
  }

  // Save the authenticated state (includes cookies and localStorage)
  await page.context().storageState({ path: authFile });

  console.log('\n========================================');
  console.log('AUTH SAVED SUCCESSFULLY');
  console.log(`Session stored at: ${authFile}`);
  console.log('You can now run authenticated E2E tests');
  console.log('========================================\n');
});
