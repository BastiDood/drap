# Project Overview

DRAP (Draft Ranking Automated Processor) automates the University of the Philippines Diliman - Department of Computer Science's yearly research lab assignment draft. Students submit ranked lab preferences; faculty review and accept students round-by-round; unassigned students enter a lottery.

For detailed domain knowledge (terminology, lifecycle, role workflows), see [the draft process document](docs/draft-process.md). If you're working on a new feature, you must first understand how the draft process works.

# Commands

```bash
pnpm fmt                  # Check formatting
pnpm fmt:fix              # Auto-fix formatting
pnpm lint                 # All linters in parallel
pnpm lint:eslint          # ESLint only
pnpm lint:svelte          # Svelte checker only
pnpm db:generate          # Generate Drizzle migrations
pnpm db:migrate           # Apply migrations
pnpm db:studio            # Drizzle Studio UI
pnpm docker:dev           # Start dev services: postgres, inngest dev, o2
pnpm docker:prod          # Start prod services: + redis, app, drizzle-gateway
```

# Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5, Tailwind 4 + `shadcn-svelte` (`bits-ui`)
- **Database:** PostgreSQL with Drizzle ORM
- **Jobs:** Inngest for event-driven background processing
- **Auth:** Google OAuth 2.0 (restricted to `@up.edu.ph` emails)
- **Validation:** Valibot for runtime schemas

# Architecture

## Code Organization

See [src/AGENTS.md](src/AGENTS.md) for detailed codebase map and convention references.

Key directories:

- `src/lib/server/database/` - Drizzle ORM ([AGENTS.md](src/lib/server/database/AGENTS.md))
- `src/lib/server/inngest/` - Event-driven jobs ([AGENTS.md](src/lib/server/inngest/AGENTS.md))
- `src/lib/features/` - Feature modules ([AGENTS.md](src/lib/features/AGENTS.md))

## Route Structure

- `/` - Landing page
- `(landing)/history/` - Draft history index and past results
- `(landing)/privacy/` - Privacy policy
- `/dashboard/` - Main app (authenticated)
  - `admin/` - Admin hub
  - `(draft)/drafts/` - Draft lifecycle management + `[draftId]/` detail views
  - `(draft)/labs/` - Lab quota management
  - `(faculty)/students/` - Faculty view/select students each round
  - `/email` - Email sender config
  - `/lab` - Lab management (faculty)
  - `/oauth` - Google OAuth flow
  - `/student` - Student hub (rankings, status)
  - `/users` - User management (admin)

# Environment Variables

| Variable                     | Description                                   |
| ---------------------------- | --------------------------------------------- |
| `ORIGIN`                     | Server origin (computes OAuth redirect)       |
| `PUBLIC_ORIGIN`              | Public origin (meta tags)                     |
| `POSTGRES_URL`               | PostgreSQL connection string                  |
| `GOOGLE_OAUTH_CLIENT_ID`     | Google OAuth credentials                      |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth credentials                      |
| `INNGEST_EVENT_KEY`          | Inngest event signing key                     |
| `INNGEST_SIGNING_KEY`        | Inngest webhook signing key                   |
| `DRIZZLE_DEBUG`              | Enable verbose Drizzle logs                   |
| `DRAP_ENABLE_EMAILS`         | Enable real email sending (default: disabled) |

Environment loading organized in `src/lib/server/env/` with hierarchical modules (e.g., `inngest/api.js`, `inngest/signing.js`).

# Development Notes

- **Dummy user:** `?/dummy` form action creates test user (dev only)

# Pre-commit Workflow

**Always run `pnpm lint` then `pnpm fmt:fix` before committing.**

If errors appear:

1. Run `pnpm lint:eslint --fix` first to address low-hanging fruit (may not be necessary).
2. Analyze remaining errors with `pnpm lint:eslint` and `pnpm lint:svelte` individually.
3. Only run the linter that reports errors.

# Additional Guidelines

- **Avoid `npx`:** Strongly prefer using package scripts defined in `package.json` (e.g., `pnpm lint`, `pnpm db:generate`) over invoking tools directly via `npx`. The project scripts are pre-configured with correct options and ensure consistent behavior.
- **Assume CWD is correct:** When running commands, do not use directory-changing flags like `git -C` or `pnpm --filter`. The current working directory is already the project root.
