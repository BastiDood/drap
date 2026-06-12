import { cwd, env } from 'node:process';

import adapter from '@sveltejs/adapter-node';
import tailwind from '@tailwindcss/vite';
import { configDefaults } from 'vitest/config';
import { defineConfig, loadEnv } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [
    {
      name: 'app-environment-loader',
      config(_, { mode }) {
        // Loads OpenTelemetry environment variables into `pnpm dev` and `pnpm preview`.
        // Existing environment variables are not overridden.
        const otel = loadEnv(mode, cwd(), ['OTEL_', 'INNGEST_']);
        for (const [key, value] of Object.entries(otel)) env[key] ??= value;
      },
    },
    tailwind(),
    sveltekit({
      adapter: adapter(),
      csp: {
        mode: 'auto',
        directives: {
          'default-src': ['none'],
          'base-uri': ['none'],
          'object-src': ['none'],
          'form-action': ['self'],
          'connect-src': ['self'],
          'font-src': ['self'],
          'frame-ancestors': ['none'],
          'img-src': [
            'self',
            'data:',
            'https://avatars.githubusercontent.com',
            'https://lh3.googleusercontent.com',
            'https://avatar.vercel.sh', // Only necessary in development.
          ],
          'script-src': ['self'],
          'script-src-elem': [
            'self',
            'unsafe-inline', // Sadly necessary due to inline `<script>` tags of `mode-switcher`.
          ],
          'script-src-attr': ['unsafe-inline'],
          'style-src': ['self'],
          'style-src-elem': ['self', 'unsafe-inline'],
          'style-src-attr': ['unsafe-inline'],
        },
      },
      experimental: {
        tracing: { server: true },
        instrumentation: { server: true },
      },
    }),
  ],
  build: { assetsInlineLimit: 0 },
  server: { host: true, allowedHosts: ['host.docker.internal'] },
  preview: { host: true, allowedHosts: ['host.docker.internal'] },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,ts}'],
    exclude: [...configDefaults.exclude, 'tests/**', 'output/**'],
  },
});
