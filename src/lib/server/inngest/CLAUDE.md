# Inngest Conventions

## Event Naming

- **Event ID**: `draft/<resource>.<verb>` (e.g., `draft/round.started`)

## Event Schemas

Define event data schemas in `schema.ts` using Valibot. Schemas define only the `data` payload (not the event name wrapper):

```ts
import * as v from 'valibot';

export const RoundStartedEvent = v.object({
  draftId: v.number(),
  round: v.nullable(v.number()),
  recipientEmail: v.string(),
  recipientName: v.string(),
});
export type RoundStartedEvent = v.InferOutput<typeof RoundStartedEvent>;
```

Register schemas in `client.js` via `EventSchemas().fromSchema()`:

```js
schemas: new EventSchemas().fromSchema({
  'draft/round.started': RoundStartedEvent,
  'draft/round.submitted': RoundSubmittedEvent,
  // ...
}),
```

## Function Structure

```ts
export const sendEmail = inngest.createFunction(
  { id: 'send-email', name: 'Send Email', retries: 3 },
  [
    { event: 'draft/round.started' },
    { event: 'draft/round.submitted' },
    { event: 'draft/lottery.intervened' },
    { event: 'draft/draft.concluded' },
    { event: 'draft/user.assigned' },
  ],
  async ({ event, step }) => {
    const creds = await step.run('get-sender-credentials', () =>
      tracer.asyncSpan('get-sender-credentials', async () => {
        // ...
      }),
    );
    // ...
  },
);
```

## Dispatching Events

Inline `inngest.send()` calls directly in route handlers. Use bulk dispatch for multiple recipients:

```js
await inngest.send(
  recipients.map(r => ({
    name: 'draft/round.started',
    data: { draftId, round, recipientEmail: r.email, recipientName: r.name },
  })),
);
```

## Service Names

- `inngest.functions.send-email` - Email sending function
