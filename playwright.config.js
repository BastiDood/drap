import { defineConfig } from '@playwright/test';

export default defineConfig({
  name: 'E2E',
  testDir: './tests',
  outputDir: './output',
  fullyParallel: true,
  workers: 3,
  retries: 0,
  maxFailures: 1,
  use: { trace: 'retain-on-failure' },
  reporter: 'dot', // Emits fewer tokens when dumping to the logs.
  projects: [
    { name: 'setup', testMatch: 'setup.test.ts' },
    { name: 'public', testMatch: ['home.test.js', 'privacy.test.js'] },
    { name: 'initial', grep: /@initial(?:\s|$)/u, dependencies: ['setup'] },
    {
      name: 'administration',
      grep: /@administration(?:\s|$)/u,
      dependencies: ['initial'],
      fullyParallel: false,
      workers: 1,
    },
    { name: 'profiles', grep: /@profiles(?:\s|$)/u, dependencies: ['initial'] },
    {
      name: 'full-lifecycle-create',
      grep: /@full-lifecycle-create(?:\s|$)/u,
      dependencies: ['administration', 'profiles'],
    },
    {
      name: 'full-lifecycle-registration-guards',
      grep: /@full-lifecycle-registration-guards(?:\s|$)/u,
      dependencies: ['full-lifecycle-create'],
    },
    {
      name: 'full-lifecycle-register-students',
      grep: /@full-lifecycle-register-students(?:\s|$)/u,
      dependencies: ['full-lifecycle-registration-guards'],
    },
    {
      name: 'full-lifecycle-start',
      grep: /@full-lifecycle-start(?:\s|$)/u,
      dependencies: ['full-lifecycle-register-students'],
    },
    {
      name: 'full-lifecycle-round-1-observe',
      grep: /@full-lifecycle-round-1-observe(?:\s|$)/u,
      dependencies: ['full-lifecycle-start'],
    },
    {
      name: 'full-lifecycle-round-1-select',
      grep: /@full-lifecycle-round-1-select(?:\s|$)/u,
      dependencies: ['full-lifecycle-round-1-observe'],
    },
    {
      name: 'full-lifecycle-round-1-advance',
      grep: /@full-lifecycle-round-1-advance(?:\s|$)/u,
      dependencies: ['full-lifecycle-round-1-select'],
    },
    {
      name: 'full-lifecycle-round-2-observe',
      grep: /@full-lifecycle-round-2-observe(?:\s|$)/u,
      dependencies: ['full-lifecycle-round-1-advance'],
    },
    {
      name: 'full-lifecycle-round-2-select',
      grep: /@full-lifecycle-round-2-select(?:\s|$)/u,
      dependencies: ['full-lifecycle-round-2-observe'],
    },
    {
      name: 'full-lifecycle-round-3-observe',
      grep: /@full-lifecycle-round-3-observe(?:\s|$)/u,
      dependencies: ['full-lifecycle-round-2-select'],
    },
    {
      name: 'full-lifecycle-round-3-select',
      grep: /@full-lifecycle-round-3-select(?:\s|$)/u,
      dependencies: ['full-lifecycle-round-3-observe'],
    },
    {
      name: 'full-lifecycle-lottery-observe',
      grep: /@full-lifecycle-lottery-observe(?:\s|$)/u,
      dependencies: ['full-lifecycle-round-3-select'],
    },
    {
      name: 'full-lifecycle-complete',
      grep: /@full-lifecycle-complete(?:\s|$)/u,
      dependencies: ['full-lifecycle-lottery-observe'],
    },
    {
      name: 'full-lifecycle-results',
      grep: /@full-lifecycle-results(?:\s|$)/u,
      dependencies: ['full-lifecycle-complete'],
    },
    {
      name: 'archived-labs-setup',
      grep: /@archived-labs-setup(?:\s|$)/u,
      dependencies: ['full-lifecycle-results'],
    },
    {
      name: 'archived-labs-register-students',
      grep: /@archived-labs-register-students(?:\s|$)/u,
      dependencies: ['archived-labs-setup'],
    },
    {
      name: 'archived-labs-start',
      grep: /@archived-labs-start(?:\s|$)/u,
      dependencies: ['archived-labs-register-students'],
    },
    {
      name: 'archived-labs-select',
      grep: /@archived-labs-select(?:\s|$)/u,
      dependencies: ['archived-labs-start'],
    },
    {
      name: 'archived-labs-complete',
      grep: /@archived-labs-complete(?:\s|$)/u,
      dependencies: ['archived-labs-select'],
    },
    {
      name: 'archived-labs-results',
      grep: /@archived-labs-results(?:\s|$)/u,
      dependencies: ['archived-labs-complete'],
    },
    {
      name: 'closed-registration',
      grep: /@closed-registration(?:\s|$)/u,
      dependencies: ['archived-labs-results'],
    },
    {
      name: 'repeated-assignment',
      grep: /@repeated-assignment(?:\s|$)/u,
      dependencies: ['closed-registration'],
    },
    { name: 'logout', grep: /@logout(?:\s|$)/u, dependencies: ['repeated-assignment'] },
  ],
  webServer: {
    // Assumes that `pnpm build` has already been run.
    command: 'pnpm preview',
    port: 4173,
    gracefulShutdown: { signal: 'SIGINT', timeout: 0 },
  },
});
