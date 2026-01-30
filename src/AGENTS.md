# Codebase Map

## Agent Instructions

**Before modifying source code:**

1. **Explore first.** Read relevant files, trace code paths, understand existing patterns.
2. **Follow conventions.** Adhere to guidelines in this file and subdirectory `AGENTS.md` files.
3. **Update docs.** Keep `AGENTS.md` and `*.md` files in `src/` synchronized with changes.

## Entry Points

- `hooks.server.js` - Request lifecycle (OTel span, session validation)
- `app.d.ts` - SvelteKit type augmentation

## Directory Structure

### `lib/`

- `components/` - Global UI (navbar, footer, shadcn-svelte primitives in `ui/`)
- `features/` - Feature modules (see `features/AGENTS.md`)
- `hooks/` - Svelte stores (`is-mobile.svelte.ts`)
- `users/` - Reusable user display components
- `server/` - Server-only code
  - `database/` - Drizzle ORM (see `database/AGENTS.md`)
  - `inngest/` - Event-driven jobs (see `inngest/AGENTS.md`)
  - `env/` - Environment variable loaders
  - `telemetry/` - OTel logger/tracer
  - `models/` - Valibot domain models (oauth, notification, email)
  - `google/` - Google API schemas

### `routes/`

- `(landing)/` - Public pages (home, history, privacy)
- `dashboard/` - Authenticated app
  - `admin/` - Admin hub page
  - `(draft)/` - Draft-scoped routes (drafts, labs management)
  - `(faculty)/` - Faculty routes requiring active draft (students selection)

## Code Style References

When implementing a new feature, you MUST adhere to the following code style references. Only read what is relevant to the current task.

- [TypeScript conventions](./TYPESCRIPT.md)
- [Svelte conventions](./SVELTE.md)
- [OpenTelemetry](./OPEN-TELEMETRY.md) - Required for `load` functions and form actions
- [Form handling](./FORM-HANDLING.md) - Required for all form submissions
