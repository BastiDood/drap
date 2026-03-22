# Inngest Conventions

> [!NOTE]
> The code snippets throughout this document are illustrative examples, not literal code from the codebase. They demonstrate conventions and patterns to follow when writing Inngest functions.

## Event Naming

- **Event ID**: `draft/<resource>.<verb>.email.batch` or `draft/<resource>.<verb>.email.fallback`
- Use `.email.batch` for batched Gmail API sends.
- Use `.email.fallback` for single-send retries after a batch send fails.

## Event Schemas

Define event data schemas inline in `eventType()` calls using Valibot. Use PascalCase for both the event binding and the exported schema type alias:

```ts
import * as v from 'valibot';
import { eventType } from 'inngest';

export const RoundStartedBatchEmailEvent = eventType('draft/round.started.email.batch', {
  schema: v.object({
    draftId: v.number(),
    round: v.nullable(v.number()),
    recipients: v.array(
      v.object({
        email: v.string(),
        name: v.string(),
      }),
    ),
  }),
});

export type RoundStartedBatchEmailSchema = v.InferOutput<typeof RoundStartedBatchEmailEvent.schema>;

export const RoundStartedFallbackEmailEvent = eventType('draft/round.started.email.fallback', {
  schema: v.object({
    draftId: v.number(),
    round: v.nullable(v.number()),
    recipientEmail: v.string(),
    recipientName: v.string(),
  }),
});

export type RoundStartedFallbackEmailSchema = v.InferOutput<
  typeof RoundStartedFallbackEmailEvent.schema
>;
```

`RoundStartedBatchEmailSchema.round` and `RoundStartedFallbackEmailSchema.round` may be `null`, which represents the review phase announcement after lottery execution.

Do not register schemas centrally on the client in v4. Define and reuse the event types directly in triggers and send sites:

```ts
export const inngest = new Inngest({
  id: 'drap',
  checkpointing: true,
  logger: Logger.byName('inngest'),
});
```

## Function Structure

Use `batchEvents` for bulk processing (up to 50 events batched with a 5s timeout). Pair each batch function with a fallback function that retries failed recipients one email at a time:

```ts
export const sendRoundStartedBatchEmail = inngest.createFunction(
  {
    id: 'send-round-started-batch-email',
    name: 'Send Round Started Batch Email',
    batchEvents: { maxSize: 50, timeout: '5s' },
    triggers: [RoundStartedBatchEmailEvent],
  },
  async ({ events, step }) => {
    await step.run('step-name', async () => {
      // Access `events` array (not single `event`)
      for (const event of events) {
        // Process each batched email event
      }
    });
  },
);

export const sendRoundStartedFallbackEmail = inngest.createFunction(
  {
    id: 'send-round-started-fallback-email',
    name: 'Send Round Started Fallback Email',
    triggers: [RoundStartedFallbackEmailEvent],
  },
  async ({ event, step }) => {
    await step.run('step-name', async () => {
      // Retry a single recipient after a batch send failure
    });
  },
);
```

## Dispatching Events

Inline `inngest.send()` calls directly in route handlers. Use bulk dispatch for multiple recipients:

```ts
await inngest.send(
  roundBatches.map(recipients =>
    RoundStartedBatchEmailEvent.create({
      draftId,
      round,
      recipients,
    }),
  ),
);

await inngest.send(
  RoundStartedFallbackEmailEvent.create({
    draftId,
    round,
    recipientEmail: failedRecipient.email,
    recipientName: failedRecipient.name,
  }),
);
```
