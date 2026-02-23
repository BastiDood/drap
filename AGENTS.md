# Project Overview

DRAP (Draft Ranking Automated Processor) automates the University of the Philippines Diliman - Department of Computer Science's yearly research lab assignment draft. Students submit ranked lab preferences; faculty review and accept students round-by-round; unassigned students enter a lottery.

For detailed domain knowledge (terminology, lifecycle, role workflows), see [the draft process document](docs/draft-process.md). If you're working on a new feature, you must first understand how the draft process works.

# Commands

```bash
pnpm fmt         # Check formatting
pnpm fmt:fix     # Auto-fix formatting
pnpm lint        # All linters in parallel
pnpm lint:eslint # ESLint only
pnpm lint:svelte # Svelte checker only
pnpm db:generate # Generate Drizzle migrations
pnpm db:migrate  # Apply migrations
pnpm db:studio   # Drizzle Studio UI
pnpm docker:dev  # Dev services: postgres, inngest dev, o2
pnpm docker:ci   # CI services: dev stack + Inngest SDK URL override to preview (4173)
pnpm docker:prod # Prod internal services: postgres, inngest prod, redis, o2, drizzle-gateway
pnpm docker:app  # Full prod environment: prod + app
```

# Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5, Tailwind 4 + `shadcn-svelte` (`bits-ui`)
- **Database:** PostgreSQL with Drizzle ORM
- **Jobs:** Inngest for event-driven background processing
- **Auth:** Google OAuth 2.0 (restricted to `@up.edu.ph` emails)
- **Validation:** Valibot for runtime schemas

# Architecture

## Code Organization

See `src/` for detailed codebase map and convention references.

Key directories:

- `src/lib/server/database/` - Drizzle ORM
- `src/lib/server/inngest/` - Event-driven jobs
- `src/lib/features/` - Feature modules

## Route Structure

- `/` - Landing page
- `(landing)/history/` - Draft history index and past results
- `(landing)/privacy/` - Privacy policy
- `/dashboard/` - Main app (authenticated)
  - `admin/` - Admin hub
  - `(draft)/drafts/` - Draft lifecycle + per-draft quota snapshot management + `[draftId]/` detail views
  - `(draft)/labs/` - Global lab configuration (default quotas + archive/restore)
  - `(faculty)/students/` - Faculty view/select students each round
  - `/email` - Email sender config
  - `/lab` - Lab management (faculty)
  - `/oauth` - Google OAuth flow
  - `/student` - Student hub (rankings, status)
  - `/users` - User management (admin)

# End-to-End Testing

Run Playwright tests with environment variables loaded:

```shell
# Ensure development-only services are spun up.
pnpm docker:dev
```

```bash
# Build first (required by playwright.config.js webServer command).
pnpm build

# Assumes current directory is the project root.
# Load only .env:
source ./scripts/test-playwright.sh

# Load .env + .env.<environment> + .env.<environment>.local:
source ./scripts/test-playwright.sh development
source ./scripts/test-playwright.sh production
```

```nu
# Load only .env:
nu ./scripts/test-playwright.nu

# Load .env + .env.<environment> + .env.<environment>.local:
nu ./scripts/test-playwright.nu development
nu ./scripts/test-playwright.nu production
```

**IMPORTANT:** Always run the end-to-end tests with the appropriate environment variables loaded. Running `pnpm test:playwright` directly will fail due to invalid environment variables.

# Pre-commit Workflow

**Always run `pnpm lint` then `pnpm fmt:fix` before committing.**

If errors appear:

1. Run `pnpm lint:eslint --fix` first to address low-hanging fruit (may not be necessary).
2. Analyze remaining errors with `pnpm lint:eslint` and `pnpm lint:svelte` individually.
3. Only run the linter that reports errors.

**After building features, write and run the new end-to-end tests with `pnpm test:playwright` as the final verification step.** See the [End-to-End Testing](#end-to-end-testing) section above for setup instructions.

# Additional Guidelines

- **Avoid `npx`:** Strongly prefer using package scripts defined in `package.json` (e.g., `pnpm lint`, `pnpm db:generate`) over invoking tools directly via `npx`. The project scripts are pre-configured with correct options and ensure consistent behavior.
- **Assume CWD is correct:** When running commands, do not use directory-changing flags like `git -C` or `pnpm --filter`. The current working directory is already the project root.
- **Learn from mistakes:** if the user corrects you on conventions or workflows, update your memory files accordingly so you will not make the same mistake ever again
