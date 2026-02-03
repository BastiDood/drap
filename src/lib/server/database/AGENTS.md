# Database Layer

Drizzle ORM with PostgreSQL.

## Module Structure

The database module is split into two files for environment isolation:

| File         | Purpose                                                   |
| ------------ | --------------------------------------------------------- |
| `drizzle.ts` | Environment-agnostic helpers, types, and `init()` factory |
| `index.js`   | Injects `POSTGRES_URL` and exports the singleton `db`     |

This separation keeps `drizzle.ts` testable and reusable without environment coupling.

## Schema Overview

Three schemas organized by domain:

| Schema  | File              | Purpose                             |
| ------- | ----------------- | ----------------------------------- |
| `drap`  | `schema/app.ts`   | Core app data (users, labs, drafts) |
| `auth`  | `schema/auth.ts`  | Session management                  |
| `email` | `schema/email.ts` | Email sender credentials            |

## Schema Files

- `schema/app.ts` - Main application tables and views
- `schema/auth.ts` - Session table
- `schema/email.ts` - Candidate sender and designated sender tables
- `schema/relation.js` - Drizzle relations
- `schema/index.js` - Barrel export
- `schema/custom/` - Custom column types (ulid, tstzrange, bytea)

## User Role Discrimination

Users are discriminated by `is_admin` and `lab_id`:

| `is_admin` | `google_user_id` | `lab_id` | Role               |
| ---------- | ---------------- | -------- | ------------------ |
| `false`    | `null`           | `null`   | Invited User       |
| `false`    | `null`           | `*`      | Invited Researcher |
| `false`    | `*`              | `null`   | Registered User    |
| `false`    | `*`              | `*`      | Drafted Researcher |
| `true`     | `null`           | `null`   | Invited Admin      |
| `true`     | `null`           | `*`      | Invited Faculty    |
| `true`     | `*`              | `null`   | Registered Admin   |
| `true`     | `*`              | `*`      | Registered Faculty |

## Custom Column Types

- **`ulid`** - ULID primary keys (`schema/custom/ulid.ts`)
- **`tstzrange`** - PostgreSQL timestamp range (`schema/custom/tstzrange.ts`)
- **`bytea`** - Binary data (`schema/custom/bytea.ts`)

## Soft Delete Pattern

Labs use soft delete via `deletedAt` column:

```ts
// Active labs view filters out deleted
export const activeLabView = app
  .view('active_lab_view')
  .as(qb => qb.select().from(lab).where(isNull(lab.deletedAt)));

// Delete = set timestamp
await db.update(schema.lab).set({ deletedAt: new Date() }).where(eq(schema.lab.id, id));

// Restore = clear timestamp
await db.update(schema.lab).set({ deletedAt: null }).where(eq(schema.lab.id, id));
```

## Query Function Patterns

### Tracer Wrapping

Every query function **must** be wrapped in `tracer.asyncSpan()`:

```ts
export async function getUserById(db: DbConnection, userId: string) {
  return await tracer.asyncSpan('get-user-by-id', async span => {
    span.setAttribute('database.user.id', userId);
    return await db.select().from(schema.user).where(eq(schema.user.id, userId)).then(assertSingle);
  });
}
```

### Runtime Safety

Use `assertSingle()` and `assertOptional()` for query results:

```ts
import { assertOptional, assertSingle } from '$lib/server/assert';

// When exactly one row expected (throws if 0 or >1)
const user = await db.select().from(users).where(eq(users.id, id)).then(assertSingle);

// When 0 or 1 row expected (returns undefined if 0)
const user = await db.select().from(users).where(eq(users.id, id)).then(assertOptional);
```

**Never use TypeScript `!` non-null assertions.** Always assert at runtime.

### Connection Types

```ts
export type DrizzleDatabase = ReturnType<typeof init>;
export type DrizzleTransaction = Parameters<Parameters<DrizzleDatabase['transaction']>[0]>[0];
export type DbConnection = DrizzleDatabase | DrizzleTransaction;
```

Functions accept `DbConnection` to work with both direct db calls and transactions.

## Import Pattern

The `db` singleton comes from `index.js`; helpers and types come from `drizzle.ts`:

```ts
import { db } from '$lib/server/database';
import { getUserById, type schema } from '$lib/server/database/drizzle';

const user = await getUserById(db, userId);
```
