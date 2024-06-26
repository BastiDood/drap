import { type CustomThemeConfig, skeleton } from '@skeletonlabs/tw-plugin';
import type { Config } from 'tailwindcss';
import { join } from 'node:path';
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
        '--on-secondary': '255 255 255',
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
        // secondary | #7b1113
        '--color-secondary-50': '235 219 220', // #ebdbdc
        '--color-secondary-100': '229 207 208', // #e5cfd0
        '--color-secondary-200': '222 196 196', // #dec4c4
        '--color-secondary-300': '202 160 161', // #caa0a1
        '--color-secondary-400': '163 88 90', // #a3585a
        '--color-secondary-500': '123 17 19', // #7b1113
        '--color-secondary-600': '111 15 17', // #6f0f11
        '--color-secondary-700': '92 13 14', // #5c0d0e
        '--color-secondary-800': '74 10 11', // #4a0a0b
        '--color-secondary-900': '60 8 9', // #3c0809
        // tertiary | #F5AB29
        '--color-tertiary-50': '254 242 223', // #fef2df
        '--color-tertiary-100': '253 238 212', // #fdeed4
        '--color-tertiary-200': '253 234 202', // #fdeaca
        '--color-tertiary-300': '251 221 169', // #fbdda9
        '--color-tertiary-400': '248 196 105', // #f8c469
        '--color-tertiary-500': '245 171 41', // #F5AB29
        '--color-tertiary-600': '221 154 37', // #dd9a25
        '--color-tertiary-700': '184 128 31', // #b8801f
        '--color-tertiary-800': '147 103 25', // #936719
        '--color-tertiary-900': '120 84 20', // #785414
        // success | #84cc16
        '--color-success-50': '237 247 220', // #edf7dc
        '--color-success-100': '230 245 208', // #e6f5d0
        '--color-success-200': '224 242 197', // #e0f2c5
        '--color-success-300': '206 235 162', // #ceeba2
        '--color-success-400': '169 219 92', // #a9db5c
        '--color-success-500': '132 204 22', // #84cc16
        '--color-success-600': '119 184 20', // #77b814
        '--color-success-700': '99 153 17', // #639911
        '--color-success-800': '79 122 13', // #4f7a0d
        '--color-success-900': '65 100 11', // #41640b
        // warning | #EAB308
        '--color-warning-50': '252 244 218', // #fcf4da
        '--color-warning-100': '251 240 206', // #fbf0ce
        '--color-warning-200': '250 236 193', // #faecc1
        '--color-warning-300': '247 225 156', // #f7e19c
        '--color-warning-400': '240 202 82', // #f0ca52
        '--color-warning-500': '234 179 8', // #EAB308
        '--color-warning-600': '211 161 7', // #d3a107
        '--color-warning-700': '176 134 6', // #b08606
        '--color-warning-800': '140 107 5', // #8c6b05
        '--color-warning-900': '115 88 4', // #735804
        // error | #ac1b38
        '--color-error-50': '243 221 225', // #f3dde1
        '--color-error-100': '238 209 215', // #eed1d7
        '--color-error-200': '234 198 205', // #eac6cd
        '--color-error-300': '222 164 175', // #dea4af
        '--color-error-400': '197 95 116', // #c55f74
        '--color-error-500': '172 27 56', // #ac1b38
        '--color-error-600': '155 24 50', // #9b1832
        '--color-error-700': '129 20 42', // #81142a
        '--color-error-800': '103 16 34', // #671022
        '--color-error-900': '84 13 27', // #540d1b
        // surface | #334030
        '--color-surface-50': '224 226 224', // #e0e2e0
        '--color-surface-100': '214 217 214', // #d6d9d6
        '--color-surface-200': '204 207 203', // #cccfcb
        '--color-surface-300': '173 179 172', // #adb3ac
        '--color-surface-400': '112 121 110', // #70796e
        '--color-surface-500': '51 64 48', // #334030
        '--color-surface-600': '46 58 43', // #2e3a2b
        '--color-surface-700': '38 48 36', // #263024
        '--color-surface-800': '31 38 29', // #1f261d
        '--color-surface-900': '25 31 24', // #191f18
    },
} satisfies CustomThemeConfig;

export default {
    darkMode: 'selector',
    content: [
        './src/**/*.{css,html,js,svelte,ts}',
        // eslint-disable-next-line no-undef
        join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}'),
    ],
    plugins: [typo, skeleton({ themes: { custom: [theme] } })],
} satisfies Config;
