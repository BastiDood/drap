import adapter from '@sveltejs/adapter-node';

/**
 * @import { Config } from '@sveltejs/kit'
 * @type {Config}
 */
export default {
  kit: {
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
        'style-src-elem': ['self'],
        'style-src-attr': ['unsafe-inline'],
      },
    },
    experimental: {
      tracing: { server: true },
      instrumentation: { server: true },
    },
  },
};
