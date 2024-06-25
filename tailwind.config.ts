import type { Config } from 'tailwindcss';
import { join } from 'node:path';
import { skeleton } from '@skeletonlabs/tw-plugin';
import typo from '@tailwindcss/typography';

export default {
    darkMode: 'selector',
    content: [
        './src/**/*.{css,html,js,svelte,ts}',
        // eslint-disable-next-line no-undef
        join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}'),
    ],
    plugins: [typo, skeleton({ themes: { preset: ['wintry'] } })],
} satisfies Config;
