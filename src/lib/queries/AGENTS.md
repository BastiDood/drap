# Query Conventions

## Directory Structure

Each query lives in `$lib/queries/fetch-<name>/`:

```
fetch-<name>/
├── index.ts  # Main `createQuery` wrapper + selectors
├── http.ts   # HTTP client
└── schema.ts # Valibot schema
```

## `schema.ts` — Validation Boundary

Define query param and response schemas here. If the query exports types, derive them from the schemas.

```ts
import * as v from 'valibot';

export const FetchItemsParams = v.object({
  categoryId: v.string(),
});
export type FetchItemsParams = v.InferInput<typeof FetchItemsParams>;

export const Item = v.object({
  id: v.string(),
  name: v.string(),
  categoryId: v.string(),
  archived: v.boolean(),
});
export type Item = v.InferOutput<typeof Item>;

export const FetchItemsResponse = v.array(Item);
export type FetchItemsResponse = v.InferOutput<typeof FetchItemsResponse>;
```

## `http.ts` — Raw HTTP Function

Wrap the transport boundary in a plain async function. Validate query params before making the request, `await` the response body, and validate the response before returning it.

```ts
import * as v from 'valibot';

import { FetchItemsParams, FetchItemsResponse } from './schema';

export async function fetchItems(params: FetchItemsParams) {
  const parsed = v.parse(FetchItemsParams, params);
  const searchParams = new URLSearchParams(parsed);

  const response = await fetch(`/api/items?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch items.');

  const json = await response.json();
  return v.parse(FetchItemsResponse, json);
}
```

## `index.ts` — TanStack Wrapper

Keep `queryKey` inline, and make `queryFn` read its arguments from `{ queryKey }`.

```ts
import { createQuery, skipToken } from '@tanstack/svelte-query';

import { fetchItems } from './http';

export function createFetchItemsQuery(categoryId: string | null) {
  return createQuery(() => ({
    queryKey: ['items', 'list', categoryId] as const,
    queryFn:
      categoryId === null
        ? skipToken
        : async ({ queryKey: [, , id] }) => await fetchItems({ categoryId: id }),
  }));
}
```

## Query Key Rules

Only serializable, cache-discriminating values go in `queryKey`. Do not hide query inputs in outer closure state when they belong in the key.

## Conditional Queries (`skipToken`)

Use `skipToken` instead of `enabled: false` when a missing input should disable the query. `refetch()` does not work with `skipToken`, so use `enabled` only if manual refetch on a disabled query is required.
