# Codebase Map

## Agent Instructions

**Before modifying source code:**

1. **Explore first.** Read relevant files, trace code paths, understand existing patterns.
2. **Follow conventions.** Adhere to guidelines in this file and subdirectory `AGENTS.md` files.
3. **Update docs.** Keep `AGENTS.md` and `*.md` files in `src/` synchronized with changes.

## Directory Structure

### `lib/`

- `components/` - Global UI
  - `ui/` - `shadcn-svelte` primitives
- `features/` - Feature modules
- `hooks/` - Svelte stores
- `users/` - Reusable user display components
- `server/` - Server-only code
  - `database/` - Drizzle ORM
  - `inngest/` - Event-driven jobs
  - `env/` - Environment variable loaders
  - `telemetry/` - OTel logger/tracer
  - `models/` - Valibot domain models
  - `google/` - Google API schemas

### `routes/`

- `(landing)/` - Public pages
- `dashboard/` - Authenticated app
  - `admin/` - Admin hub page
  - `(draft)/` - Draft-scoped routes
  - `(faculty)/` - Faculty routes requiring active draft (students selection)

## Code Style References

When implementing a new feature, you MUST adhere to the following code style references. Only read what is relevant to the current task.

- [TypeScript conventions](./TYPESCRIPT.md)
- [Svelte conventions](./SVELTE.md)
- [OpenTelemetry](./OPEN-TELEMETRY.md) - Required for `load` functions and form actions
- [Form handling](./FORM-HANDLING.md) - Required for all form submissions

## Project Memory Guidelines

When you consistently make mistakes on a user request, make sure to update your memory files to avoid making the same mistake again. Only update the appropriately scoped memory file to avoid context bloat in unrelated areas of the codebase.
