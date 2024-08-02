import { type CustomThemeConfig, skeleton } from '@skeletonlabs/tw-plugin';
import type { Config } from 'tailwindcss';
import { join } from 'node:path';

import form from '@tailwindcss/forms';
import typo from '@tailwindcss/typography';

const theme = {
    name: 'dcs',
    properties: {
        // =~= Theme Properties =~=
        '--theme-font-family-base': `system-ui`,
        '--theme-font-family-heading': `system-ui`,
        '--theme-font-color-base': '0 0 0',
        '--theme-font-color-dark': '255 255 255',
        '--theme-rounded-base': '8px',
        '--theme-rounded-container': '8px',
        '--theme-border-base': '2px',
        // =~= Theme On-X Colors =~=
        '--on-primary': '255 255 255',
        '--on-secondary': '0 0 0',
        '--on-tertiary': '0 0 0',
        '--on-success': '0 0 0',
        '--on-warning': '0 0 0',
        '--on-error': '255 255 255',
        '--on-surface': '255 255 255',
        // =~= Theme Colors  =~=
        // primary | #136734
        '--color-primary-50': '220 232 225', // #dce8e1
        '--color-primary-100': '208 225 214', // #d0e1d6
        '--color-primary-200': '196 217 204', // #c4d9cc
        '--color-primary-300': '161 194 174', // #a1c2ae
        '--color-primary-400': '90 149 113', // #5a9571
        '--color-primary-500': '19 103 52', // #136734
        '--color-primary-600': '17 93 47', // #115d2f
        '--color-primary-700': '14 77 39', // #0e4d27
        '--color-primary-800': '11 62 31', // #0b3e1f
        '--color-primary-900': '9 50 25', // #093219
        // secondary | #ABD9CD
        '--color-secondary-50': '242 249 248', // #f2f9f8
        '--color-secondary-100': '238 247 245', // #eef7f5
        '--color-secondary-200': '234 246 243', // #eaf6f3
        '--color-secondary-300': '221 240 235', // #ddf0eb
        '--color-secondary-400': '196 228 220', // #c4e4dc
        '--color-secondary-500': '171 217 205', // #ABD9CD
        '--color-secondary-600': '154 195 185', // #9ac3b9
        '--color-secondary-700': '128 163 154', // #80a39a
        '--color-secondary-800': '103 130 123', // #67827b
        '--color-secondary-900': '84 106 100', // #546a64
        // tertiary | #cdb856
        '--color-tertiary-50': '248 244 230', // #f8f4e6
        '--color-tertiary-100': '245 241 221', // #f5f1dd
        '--color-tertiary-200': '243 237 213', // #f3edd5
        '--color-tertiary-300': '235 227 187', // #ebe3bb
        '--color-tertiary-400': '220 205 137', // #dccd89
        '--color-tertiary-500': '205 184 86', // #cdb856
        '--color-tertiary-600': '185 166 77', // #b9a64d
        '--color-tertiary-700': '154 138 65', // #9a8a41
        '--color-tertiary-800': '123 110 52', // #7b6e34
        '--color-tertiary-900': '100 90 42', // #645a2a
        // success | #56e74b
        '--color-success-50': '230 251 228', // #e6fbe4
        '--color-success-100': '221 250 219', // #ddfadb
        '--color-success-200': '213 249 210', // #d5f9d2
        '--color-success-300': '187 245 183', // #bbf5b7
        '--color-success-400': '137 238 129', // #89ee81
        '--color-success-500': '86 231 75', // #56e74b
        '--color-success-600': '77 208 68', // #4dd044
        '--color-success-700': '65 173 56', // #41ad38
        '--color-success-800': '52 139 45', // #348b2d
        '--color-success-900': '42 113 37', // #2a7125
        // warning | #ff932e
        '--color-warning-50': '255 239 224', // #ffefe0
        '--color-warning-100': '255 233 213', // #ffe9d5
        '--color-warning-200': '255 228 203', // #ffe4cb
        '--color-warning-300': '255 212 171', // #ffd4ab
        '--color-warning-400': '255 179 109', // #ffb36d
        '--color-warning-500': '255 147 46', // #ff932e
        '--color-warning-600': '230 132 41', // #e68429
        '--color-warning-700': '191 110 35', // #bf6e23
        '--color-warning-800': '153 88 28', // #99581c
        '--color-warning-900': '125 72 23', // #7d4817
        // error | #c90c10
        '--color-error-50': '247 219 219', // #f7dbdb
        '--color-error-100': '244 206 207', // #f4cecf
        '--color-error-200': '242 194 195', // #f2c2c3
        '--color-error-300': '233 158 159', // #e99e9f
        '--color-error-400': '217 85 88', // #d95558
        '--color-error-500': '201 12 16', // #c90c10
        '--color-error-600': '181 11 14', // #b50b0e
        '--color-error-700': '151 9 12', // #97090c
        '--color-error-800': '121 7 10', // #79070a
        '--color-error-900': '98 6 8', // #620608
        // surface | #223f3a
        '--color-surface-50': '222 226 225', // #dee2e1
        '--color-surface-100': '211 217 216', // #d3d9d8
        '--color-surface-200': '200 207 206', // #c8cfce
        '--color-surface-300': '167 178 176', // #a7b2b0
        '--color-surface-400': '100 121 117', // #647975
        '--color-surface-500': '34 63 58', // #223f3a
        '--color-surface-600': '31 57 52', // #1f3934
        '--color-surface-700': '26 47 44', // #1a2f2c
        '--color-surface-800': '20 38 35', // #142623
        '--color-surface-900': '17 31 28', // #111f1c
    },
} satisfies CustomThemeConfig;

export default {
    darkMode: 'selector',
    content: [
        './src/**/*.{css,html,js,svelte,ts}',
        join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}'),
    ],
    plugins: [form, typo, skeleton({ themes: { custom: [theme] } })],
} satisfies Config;
