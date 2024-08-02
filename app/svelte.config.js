import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
    extensions: ['.svelte'],
    preprocess: vitePreprocess(),
    kit: { adapter: adapter() },
};
