import adapter from '@sveltejs/adapter-node';

/**
 * @import { Config } from '@sveltejs/kit'
 * @type {Config}
 */
export default {
  extensions: ['.svelte'],
  kit: { adapter: adapter() },
};
