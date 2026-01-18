# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DRAP (Draft Ranking Automated Processor) automates the University of the Philippines Diliman - Department of Computer Science's yearly research lab assignment draft. Students submit ranked lab preferences; faculty review and accept students round-by-round; unassigned students enter a lottery.

## Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Vite dev server
pnpm build                # Production build
pnpm preview              # Preview production build
pnpm fmt                  # Check formatting
pnpm fmt:fix              # Auto-fix formatting
pnpm lint                 # All linters in parallel
pnpm lint:eslint          # ESLint only
pnpm lint:svelte          # Svelte checker only
pnpm db:generate          # Generate Drizzle migrations
pnpm db:migrate           # Apply migrations
pnpm db:studio            # Drizzle Studio UI
```

Docker (dev): `docker compose --profile dev up --detach`
Docker (prod): `docker compose --profile prod up --detach`

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5, TailwindCSS + Skeleton UI
- **Database:** PostgreSQL with Drizzle ORM
- **Queue:** BullMQ (Redis-backed) for async email
- **Auth:** Google OAuth 2.0 (restricted to `@up.edu.ph` emails)
- **Validation:** Valibot for runtime schemas

## Architecture

### Request Flow (`src/hooks.server.ts`)

1. Each request gets a Pino logger with unique request ID
2. `Database.withLogger()` attaches DB instance to `event.locals.db`
3. `NotificationDispatcher` attached to `event.locals.dispatch`
4. Session validated from `sid` cookie via `db.getUserFromValidSession(sid)`

### Database Layer (`src/lib/server/database/`)

- `Database` class wraps Drizzle with logging/timing decorators
- `@timed` decorator auto-logs query execution time
- Transactions via `.begin(fn)` method
- Three schemas: `drap` (main data), `auth` (sessions), `email` (notifications)

### Notification System (`src/lib/server/models/notification.ts`)

Discriminated unions for type-safe notifications:

```
Notification = variant('target', [DraftNotification, UserNotification])
DraftNotification = variant('type', [RoundStart, RoundSubmit, LotteryIntervention, Concluded])
```

Email sent via Gmail API using OAuth credentials from designated sender.

### Route Structure

- `/` - Landing page
- `/oauth/` - Google OAuth flow
- `/dashboard/` - Main app
  - `(admin)/` - Admin routes: `/labs`, `/drafts`, `/users`
  - `(draft)/` - Student routes: `/ranks`, `/students`
  - `/email` - Email sender config
  - `/lab` - Lab management (faculty)
- `/profile/` - User profile
- `/history/[draft]` - Past draft results
- `/privacy/` - Privacy policy

### Draft Process Flow

1. **Registration:** Students provide name, email, student number, ranked lab preferences
2. **Regular rounds:** Each round, labs see first-choice students → accept subset → repeat with next preference
3. **Lottery:** Remaining students shuffled, assigned round-robin to labs with slots
4. **Conclusion:** All students assigned

## Code Conventions

- Strive to use **JavaScript by default** (`.js`), and only resort to TypeScript (`.ts`) when syntax requires it
- **Discriminated unions** with explicit `interface` over inlined object types
- **`switch`** over long `if` chains for union discrimination
- **`const enum`** over hardcoded strings
- **Type inference** preferred over explicit return types
- **Runtime assertions** over TypeScript non-null assertions (`!`)
- **Valibot schemas** double as runtime validation + type definitions

## Environment Variables

| Variable                     | Description                      |
| ---------------------------- | -------------------------------- |
| `POSTGRES_URL`               | PostgreSQL connection string     |
| `REDIS_URL`                  | Redis connection URL for BullMQ  |
| `GOOGLE_OAUTH_CLIENT_ID`     | Google OAuth credentials         |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth credentials         |
| `GOOGLE_OAUTH_REDIRECT_URI`  | Must point to `/oauth/callback/` |
| `JOB_CONCURRENCY`            | Max concurrent email jobs        |
| `DRIZZLE_DEBUG`              | Enable verbose Drizzle logs      |

## Development Notes

- **Dummy user:** `?/dummy` form action creates test user (dev only)
- **Package manager:** pnpm 10.28.0 enforced
- **Node version:** 24.13.0

## Pre-commit Workflow

**Always run `pnpm lint` then `pnpm fmt:fix` before committing.**

If errors appear:

1. Run `pnpm lint:eslint --fix` first to address low-hanging fruit (may not be necessary).
2. Analyze remaining errors with `pnpm lint:eslint` and `pnpm lint:svelte` individually.
3. Only run the linter that reports errors.
