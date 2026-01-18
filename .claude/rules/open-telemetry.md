# OpenTelemetry Conventions

## Service Naming

Use hierarchical dot-separated names: `module.submodule.service`

Examples:

- `hooks` - Request lifecycle
- `routes.dashboard.admin.labs` - Admin labs route
- `database.user` - User database queries
- `queue.notification.dispatcher` - Notification queue

## Logger & Tracer Instantiation

Every module that needs logging/tracing declares at module level:

```ts
import { Logger } from '$lib/server/telemetry/logger';
import { Tracer } from '$lib/server/telemetry/tracer';

const SERVICE_NAME = 'routes.dashboard.admin.labs';
const logger = Logger.byName(SERVICE_NAME);
const tracer = Tracer.byName(SERVICE_NAME);
```

## Logger Usage

```ts
// Message first, then optional attributes object
logger.trace('detailed debug info', { key: 'value' });
logger.debug('debug info', { key: 'value' });
logger.info('informational', { key: 'value' });
logger.warn('warning message', { key: 'value' });
logger.error('error message');
logger.error('error with exception', error, { key: 'value' });
logger.fatal('fatal error', error, { key: 'value' });
```

**Signature patterns:**

- `trace/debug/info/warn(body: string, attributes?: object)`
- `error/fatal(body: string, error?: Exception, attributes?: object)`

### Log Levels

- `trace`: Very detailed debugging, high volume
- `debug`: Developer debugging info
- `info`: Normal operations (request started, completed)
- `warn`: Unexpected but recoverable situations
- `error`: Errors that need attention
- `fatal`: Unrecoverable errors

## Span Wrapping

Use `kebab-case` for span names:

```ts
// Async function
return tracer.asyncSpan('get-user-by-id', async span => {
  span.setAttribute('database.user.id', userId);
  // ... implementation
});

// Sync function
return tracer.syncSpan('validate-input', span => {
  span.setAttribute('input.length', input.length);
  // ... implementation
});
```

## Attribute Naming

Use dot-separated namespace: `namespace.resource.property`

Examples:

- `http.request.method`
- `http.response.status`
- `database.user.id`
- `queue.notification.count`

## Database Function Pattern

All database functions take `db: DbConnection` as first parameter:

```ts
import type { DbConnection } from '$lib/server/database';

export async function getUserById(db: DbConnection, userId: string) {
  return tracer.asyncSpan('get-user-by-id', async span => {
    span.setAttribute('database.user.id', userId);
    // Query implementation unchanged
  });
}
```

Transaction usage:

```ts
import { db, begin } from '$lib/server/database';

// Shadow the `db` variable here so the outer one is inaccessible.
await begin(db, async db => {
  await insertUser(db, userData);
  await insertProfile(db, profileData);
});
```

## Route File Pattern

```ts
import { db, someFunction } from '$lib/server/database';
import { Logger } from '$lib/server/telemetry/logger';

const SERVICE_NAME = 'routes.xxx.yyy';
const logger = Logger.byName(SERVICE_NAME);

export async function load({ locals: { session } }) {
  // Use singleton db directly
  const data = await someFunction(db, args);
  logger.info('message');
  return { data };
}
```

## Request Context

Request-scoped context is propagated via OpenTelemetry trace context. The root span in `hooks.server.ts` sets request attributes; child spans inherit via trace propagation.

No need for `logger.child()` - span attributes handle context.
