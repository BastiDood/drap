import { defineConfig } from '@playwright/test';

export default defineConfig({
  name: 'E2E',
  testDir: './tests',
  outputDir: './output',
  // Only a single worker so that the database fixtures are shared across all tests.
  workers: 1,
  fullyParallel: true,
  // Assumes that `pnpm build` has already been run.
  webServer: { command: 'pnpm preview', port: 4173 },
});
