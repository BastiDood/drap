# Inngest Conventions

## Event Naming

- **Event ID**: `draft/<resource>.<verb>` (e.g., `draft/round.started`)

## Event Schemas

Define event data schemas in `schema.ts` using Valibot. Schemas define only the `data` payload (not the event name wrapper), then wrap them with `eventType()` for v4:

```ts
import * as v from 'valibot';
import { eventType } from 'inngest';

export const RoundStartedEvent = v.object({
  draftId: v.number(),
  round: v.nullable(v.number()),
  recipientEmail: v.string(),
  recipientName: v.string(),
});
export type RoundStartedEvent = v.InferOutput<typeof RoundStartedEvent>;

export const roundStartedEvent = eventType('draft/round.started', {
  schema: RoundStartedEvent,
});
```

`RoundStartedEvent.round` may be `null`, which represents the review phase announcement after lottery execution.

Do not register schemas centrally on the client in v4. Define and reuse the event types directly in triggers and send sites:

```js
export const inngest = new Inngest({
  id: 'drap',
  checkpointing: true,
  logger: Logger.byName('inngest'),
});
```

## Function Structure

Use `batchEvents` for bulk processing (up to 100 events batched with 10s timeout):

```ts
export const sendEmail = inngest.createFunction(
  {
    id: 'send-email',
    name: 'Send Email',
    batchEvents: { maxSize: 100, timeout: '10s' },
    triggers: [roundStartedEvent, roundSubmittedEvent],
  },
  async ({ events, step }) => {
    await step.run('step-name', async () => {
      // Access `events` array (not single `event`)
      for (const event of events) {
        // Process each event
      }
    });
  },
);
```

## Dispatching Events

Inline `inngest.send()` calls directly in route handlers. Use bulk dispatch for multiple recipients:

```js
await inngest.send(
  recipients.map(({ email, name }) =>
    roundStartedEvent.create({
      draftId,
      round,
      recipientEmail: email,
      recipientName: name,
    }),
  ),
);
```
