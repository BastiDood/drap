import { Renderer } from '@better-svelte-email/server';

// Resolved hex equivalents of the oklch design tokens from `app.css` :root.
export const emailRenderer = new Renderer({
  tailwindConfig: {
    theme: {
      extend: {
        colors: {
          primary: { DEFAULT: '#087542', foreground: '#f2fdf0' },
          secondary: { DEFAULT: '#96ceae', foreground: '#0d332b' },
          foreground: '#121815',
          muted: { DEFAULT: '#c2c9ce', foreground: '#444f47' },
          card: { DEFAULT: '#e9eff3', foreground: '#36413a' },
        },
      },
    },
  },
});
