import adapter from '@sveltejs/adapter-node';

/**
 * @import { Config } from '@sveltejs/kit'
 * @type {Config}
 */
export default {
  kit: {
    adapter: adapter(),
    experimental: {
      tracing: { server: true },
      instrumentation: { server: true },
    },
  },
};
