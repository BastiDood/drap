# Database Layer

Drizzle ORM with PostgreSQL.

## Schema Change Workflow

The data model is expected to be edited directly in the schema files when requirements change.

```bash
# After editing the Drizzle schema, always auto-generate the migration into `drizzle/`.
pnpm db:generate --name $DESCRIPTIVE_MIGRATION_NAME
```

Never hand-write schema migrations.

```bash
# For data-only backfill/transformation migrations that prepare future constraint hardening.
pnpm db:generate --custom --name $BESPOKE_BACKFILL_NAME
```

Use `--custom` migrations only for data operations, not for schema diffs that Drizzle can auto-generate.

```bash
# Then apply generated migration(s) to the database instance.
pnpm db:migrate
```

> [!CAUTION]
> Order of migrations matters! Always apply auto-generated migrations first, then apply custom migrations, and finally apply any follow-up auto-generated migrations that were enabled by the custom data-only migrations. This is typically the case for data constraint updates that require backfills.

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

## Draft Quota Snapshots

`drap.lab` remains the central hub for lab catalog configuration:

- `id`/`name`: lab identity used across drafts
- `deletedAt`: archive/restore state for labs

`drap.draft_lab_quota` stores per-draft quota snapshots (`NOT NULL DEFAULT 0`):

- `initialQuota`: defaults to `0` when `initDraft` snapshots active labs; editable only during registration on draft detail
- `lotteryQuota`: editable only during intervention/lottery setup on draft detail; used by `Run Lottery` round-robin allocation

This keeps finalized-draft reporting independent from later catalog edits (`create`, `archive`, `restore`) on `/dashboard/labs`, and ensures those updates do not mutate active-draft snapshots.

## Draft Phase Sentinels

Use `currRound` and `activePeriod` together:

- `currRound = 0`: registration
- `1..maxRounds`: regular rounds
- `currRound = maxRounds + 1`: intervention/lottery setup
- `currRound = null`: review (lottery already executed, pending finalization)
- `upper(activePeriod) IS NOT NULL`: draft is finalized

## OAuth Token Encryption

Sensitive OAuth sender tokens in `email.candidate_sender` are assumed to be encrypted at the application layer with AES-256-GCM before they are written to the database. These are opaque `BYTEA` values as far as the database is concerned.

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

Functions accept `DbConnection` (i.e., `DrizzleDatabase | DrizzleTransaction`) to work with both direct database calls and transactions.

## Import Pattern

The `db` singleton comes from `index.js`; helpers and types come from `drizzle.ts`:

```ts
import { db } from '$lib/server/database';
import { getUserById, type schema } from '$lib/server/database/drizzle';

const user = await getUserById(db, userId);
```
