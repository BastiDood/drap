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
pnpm docker:dev           # Start dev services: postgres, inngest dev, o2
pnpm docker:prod          # Start prod services: + redis, app, drizzle-gateway
```

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 5, Tailwind 4 + shadcn-svelte (bits-ui)
- **Database:** PostgreSQL with Drizzle ORM
- **Jobs:** Inngest for event-driven background processing
- **Auth:** Google OAuth 2.0 (restricted to `@up.edu.ph` emails)
- **Validation:** Valibot for runtime schemas

## Architecture

### Request Flow (`src/hooks.server.js`)

1. Each request wrapped in OpenTelemetry span with unique request ID
2. Session validated from `sid` cookie via `getUserFromValidSession(db, sid)`
3. User attached to `event.locals.session`

### Database Layer (`src/lib/server/database/`)

- Drizzle ORM with singleton `db` export
- Transactions via `begin(db, fn)` function
- Three schemas: `drap` (main data), `auth` (sessions), `email` (sender credentials)

### Event System (`src/lib/server/inngest/`)

Inngest-based event-driven notifications.

**Event types:**

- `draft/round.started` - Notifies faculty when round begins
- `draft/round.submitted` - Acknowledges lab submission
- `draft/lottery.intervened` - Manual lottery assignment notification
- `draft/draft.concluded` - Draft completion notification
- `draft/user.assigned` - Direct notification to assigned student

**Bulk email:** Up to 100 events batched per Inngest function invocation, sent via Gmail API batch endpoint.

### Route Structure

- `/` - Landing page
- `/history/` - Draft history index
- `/history/[draft]` - Past draft results
- `/privacy/` - Privacy policy
- `/dashboard/` - Main app
  - `(admin)/` - Admin routes: `/labs`, `/drafts`
  - `(draft)/` - Student routes: `/ranks`, `/students`
  - `/email` - Email sender config
  - `/lab` - Lab management (faculty)
  - `/oauth` - Google OAuth flow
  - `/profile` - User profile
  - `/users` - User management (admin)

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

| Variable                     | Description                             |
| ---------------------------- | --------------------------------------- |
| `ORIGIN`                     | Server origin (computes OAuth redirect) |
| `PUBLIC_ORIGIN`              | Public origin (meta tags)               |
| `POSTGRES_URL`               | PostgreSQL connection string            |
| `GOOGLE_OAUTH_CLIENT_ID`     | Google OAuth credentials                |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth credentials                |
| `INNGEST_EVENT_KEY`          | Inngest event signing key               |
| `INNGEST_SIGNING_KEY`        | Inngest webhook signing key             |
| `DRIZZLE_DEBUG`              | Enable verbose Drizzle logs             |

## Development Notes

- **Dummy user:** `?/dummy` form action creates test user (dev only)
- **Package manager:** pnpm 10.28.1 enforced
- **Node version:** 24.13.0

## Pre-commit Workflow

**Always run `pnpm lint` then `pnpm fmt:fix` before committing.**

If errors appear:

1. Run `pnpm lint:eslint --fix` first to address low-hanging fruit (may not be necessary).
2. Analyze remaining errors with `pnpm lint:eslint` and `pnpm lint:svelte` individually.
3. Only run the linter that reports errors.
