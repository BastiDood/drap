import tailwind from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [tailwind(), sveltekit()],
  build: { assetsInlineLimit: 0 },
});
