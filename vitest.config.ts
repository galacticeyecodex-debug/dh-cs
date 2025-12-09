/**
 * VITEST CONFIGURATION
 * ----------------------------------------------------------------------------
 * This file configures the Vitest testing framework for the application.
 * 
 * FUNCTIONALITY:
 * - Sets up the React plugin to handle JSX/TSX transformations during tests.
 * - Configures the test environment to use 'jsdom', simulating a browser-like
 *   environment for testing React components.
 * - Defines path aliases (e.g., '@') to match the Next.js and TypeScript configurations,
 *   ensuring imports work correctly in tests.
 * - Specifies code coverage settings, including providers and exclusion patterns.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '**/*.config.ts',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
