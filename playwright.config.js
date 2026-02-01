import { defineConfig } from '@playwright/test';

export default defineConfig({
  name: 'E2E',
  testDir: './tests',
  outputDir: './output',
  // Assumes that `pnpm build` has already been run.
  webServer: { command: 'pnpm preview', port: 4173 },
});
