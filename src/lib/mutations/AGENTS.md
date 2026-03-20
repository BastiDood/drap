# Mutation Conventions

## Directory Structure

Each mutation lives in `$lib/mutations/<action>-<entity>/`:

```
<action>-<entity>/
├── index.ts   # TanStack createMutation wrapper
├── http.ts    # Raw HTTP helper
└── schema.ts  # Valibot schema
```

## `schema.ts` — Validation Boundary

Define request and response schemas here. If the mutation exports types, derive them from the schemas.

```ts
import * as v from 'valibot';

export const CreateItemRequest = v.object({
  name: v.string(),
});
export type CreateItemRequest = v.InferInput<typeof CreateItemRequest>;

export const CreateItemResponse = v.object({
  id: v.string(),
  name: v.string(),
});
export type CreateItemResponse = v.InferOutput<typeof CreateItemResponse>;
```

## `http.ts` — Raw HTTP Function

Wrap the transport boundary in a plain async function. Validate the outgoing payload, check `response.ok`, `await` the response body, and validate the response before returning it.

```ts
import * as v from 'valibot';

import { CreateItemRequest, CreateItemResponse } from './schema';

export async function createItem(data: CreateItemRequest) {
  const response = await fetch('/api/items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('Failed to create item.');
  const json = await response.json();
  return v.parse(CreateItemResponse, json);
}
```

## `index.ts` — TanStack Wrapper

- Let `mutationFn` receive the mutation payload directly
- Prefer inference over explicit types unless the annotation is carrying its weight
- Use `onSuccess` (not `onSettled`) for invalidation — failed mutations don't change data
- `onSuccess` 4th arg provides `{ client }` from TanStack Query meta context — never import `useQueryClient`

```ts
import { createMutation } from '@tanstack/svelte-query';

import { createItem } from './http';

export function createCreateItemMutation() {
  return createMutation(() => ({
    async mutationFn(data) {
      return await createItem(data);
    },
    async onSuccess(_data, _variables, _onMutateResult, { client }) {
      // Leverage query key prefixes to mass-invalidate related queries
      await client.invalidateQueries({ queryKey: ['items'] });
    },
  }));
}
```

## Component Usage

Use hook-level callbacks for invalidation and per-call callbacks for UI-local behavior.

```svelte
<script lang="ts">
  import { createCreateItemMutation } from '$lib/mutations/create-item';

  const mutation = createCreateItemMutation();

  function handleSubmit(data, submitter) {
    mutation.mutate(data, {
      onSuccess() {
        // ...
      },
      onSettled() {
        // ...
        submitter.disabled = false;
      },
    });
  }
</script>
```

Invalidate **all** query keys whose data could be affected by the mutation.
