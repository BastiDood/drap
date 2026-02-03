import { defineConfig } from '@playwright/test';

export default defineConfig({
  name: 'E2E',
  testDir: './tests',
  outputDir: './output',
  fullyParallel: false,
  webServer: {
    // Assumes that `pnpm build` has already been run.
    command: 'pnpm preview',
    port: 4173,
    gracefulShutdown: { signal: 'SIGINT', timeout: 0 },
  },
});
