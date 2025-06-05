# DRAP: Draft Ranking Automated Processor

Welcome to DRAP: the Draft Ranking Automated Processor for the [University of the Philippines] [Diliman] - [Department of Computer Science]'s yearly draft of research lab assignments. In a nutshell, this web application automates the mechanics of the draft:

[University of the Philippines]: https://up.edu.ph/
[Diliman]: https://upd.edu.ph/
[Department of Computer Science]: https://dcs.upd.edu.ph/

1. All participating students register for the draft by providing their full name, email, student number, and lab rankings (ordered by preference) to the draft administrators.
1. The regular draft process begins. For each round in the draft:
    1. Draft administrators notify (typically via email) the lab heads about all of the students that have chosen their respective research lab as the first choice.
    1. Each lab selects a subset (i.e., possibly none, some, or all) of these first-choice students to accept them into the lab. After this point, the selected students are considered to be "drafted" and are thus no longer part of the next rounds.
    1. The next round begins when all of the labs have submitted their preferences. This time around, the second-choice preferences of the remaining students are evaluated (and so on).
1. Should there be students remaining by the end of the regular draft process, the lottery round begins.
1. Before the randomization stage, draft administrators first negotiate with participating labs (that have remaining slots) to check if any of the labs would like to accept some of the remaining students immediately.
1. After manual negotiation and intervention, the remaining students are shuffled and assigned to participating labs in a round-robin fashion.
1. The draft concludes when all registered participants have been assigned to a lab.

## Development

The application is composed of two components: the [main web application](./app/) (SvelteKit) and a [background email worker](./email/) (TypeScript). Data persistence is backed by PostgreSQL.

### Environment Variables

| Variable                     | Description                                                      |
| ---------------------------- | ---------------------------------------------------------------- |
| `POSTGRES_URL`               | The connection string to the PostgreSQL instance.                |
| `GOOGLE_OAUTH_CLIENT_ID`     | OAuth 2.0 credentials retrieved from the [Google Cloud Console]. |
| `GOOGLE_OAUTH_CLIENT_SECRET` | OAuth 2.0 credentials retrieved from the [Google Cloud Console]. |
| `GOOGLE_OAUTH_REDIRECT_URI`  | OAuth 2.0 credentials retrieved from the [Google Cloud Console]. |

[Google Cloud Console]: https://console.cloud.google.com/

### Setting up the Codebase

```bash
# Install dependencies.
pnpm install

# Check formatting.
pnpm fmt # prettier

# Apply formatting auto-fix.
pnpm fmt:fix # prettier --write .

# Generate SvelteKit-specific typings.
pnpm --filter=drap-app sync
```

### Linting the Codebase

```bash
# Check linting rules.
pnpm lint:js
pnpm --filter=drap-app lint:html
pnpm --filter=drap-app lint:css
pnpm --filter=drap-app lint:svelte

# Perform all lints in parallel.
pnpm --parallel --recursive '/^lint:/'
```

### Running the Development Server

```bash
# Run the Vite dev server for SvelteKit.
pnpm --filter=drap-app dev

# Run the Vite preview server for SvelteKit.
pnpm --filter=drap-app preview

# Run the SWC-backed runner for the TypeScript worker.
pnpm --filter=drap-email start
```

### Building the Applications

```bash
# Build the main web application (SvelteKit).
pnpm --filter=drap-app build
node --env-file=.env app/build/index.js

# Build the background email worker (TypeScript).
pnpm --filter=drap-email build
node --env-file=.env --enable-source-maps email/dist/main.js

# Build all applications in parallel.
pnpm --parallel --recursive build
```

## Acknowledgements

The DRAP project, licensed under the [GNU Affero General Public License v3], was originally developed by [Sebastian Luis S. Ortiz][BastiDood] and [Victor Edwin E. Reyes][VeeIsForVanana] as a service project under the [UP Center for Student Innovations]. The DRAP [logo](./app/src/lib/favicon.ico) and [banner](./app/src/lib/banner.png) were originally designed and created by [Angelica Julianne A. Raborar][Anjellyrika].

[BastiDood]: https://github.com/BastiDood
[VeeIsForVanana]: https://github.com/VeeIsForVanana
[Anjellyrika]: https://github.com/Anjellyrika
[UP Center for Student Innovations]: https://up-csi.org/
[GNU Affero General Public License v3]: ./LICENSE
