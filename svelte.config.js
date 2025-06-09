import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/**
 * @import { Config } from '@sveltejs/kit'
 * @type {Config}
 */
export default {
  extensions: ['.svelte'],
  preprocess: vitePreprocess(),
  kit: { adapter: adapter() },
};
