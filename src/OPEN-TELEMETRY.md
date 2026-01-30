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

Use dot-separated namespace with `snake_case` properties: `namespace.resource.property`

### Namespace Prefixes

| Prefix       | Context         | Use Case                                       |
| ------------ | --------------- | ---------------------------------------------- |
| `session.*`  | Request context | Span attributes for authenticated request info |
| `user.*`     | User entity     | Log attributes for user data                   |
| `draft.*`    | Draft entity    | Log attributes for draft data                  |
| `lab.*`      | Lab entity      | Log attributes for lab data                    |
| `email.*`    | Email entity    | Log attributes for email sender data           |
| `http.*`     | HTTP layer      | Request/response metadata                      |
| `database.*` | Database layer  | Query context                                  |

### Session Attributes (Spans)

Use in `span.setAttributes()` to capture request context:

| Attribute                | Type    | Description                  |
| ------------------------ | ------- | ---------------------------- |
| `session.id`             | string  | Session ID                   |
| `session.user.id`        | string  | User ID                      |
| `session.user.email`     | string  | User email                   |
| `session.user.is_admin`  | boolean | Admin flag                   |
| `session.user.lab_id`    | string  | Lab assignment (nullable)    |
| `session.user.google_id` | string  | Google account ID (nullable) |

### Entity Attributes (Logs)

Use in logger calls to describe entity state:

**User attributes:**

- `user.id`, `user.email`, `user.is_admin`, `user.lab_id`
- `user.google_id`, `user.student_number`
- `user.given_name`, `user.family_name`

**Draft attributes:**

- `draft.id`, `draft.round.current`, `draft.round.max`
- `draft.registration.closes_at`, `draft.is_done`
- `draft.student.count`, `draft.event_count`

**Lab attributes:**

- `lab.id`, `lab.name`, `lab.count`
- `lab.researcher_count`

## Span Attribute Guidelines

Capture all closure inputs at the start of each span:

```ts
return tracer.asyncSpan('load-lab-page', async span => {
  // Bulk set non-nullable attributes immediately
  span.setAttributes({
    'session.id': sessionId,
    'session.user.id': userId,
    'session.user.is_admin': isAdmin,
  });

  // Conditionally set nullable attributes
  if (labId !== null) span.setAttribute('session.user.lab_id', labId);
  if (googleUserId !== null) span.setAttribute('session.user.google_id', googleUserId);

  // ... implementation
});
```

- Use `span.setAttributes({...})` for bulk setting multiple (possibly `undefined`) attributes
- Use `span.setAttribute(key, value)` for single attributes
- Use `if` conditions for nullable values (never set `null` as attribute value)

### Permission Failure Logging

For `logger.error` on permission failures, use `user.*` prefix (not `auth.*`):

```ts
logger.error('insufficient permissions to access page', void 0, {
  'user.is_admin': user.isAdmin,
  'user.google_id': user.googleUserId,
  'user.lab_id': user.labId,
});
```

Note: `logger.error` signature is `(body, error?, attributes?)` - pass `void 0` when no exception.

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
