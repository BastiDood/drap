# Svelte Conventions

## Props Typing

Use `Pick<schema.*, 'field1' | 'field2'>` from `$lib/server/database` instead of inlining object type definitions:

```svelte
<script lang="ts" module>
  import type { schema } from '$lib/server/database';

  export interface Props {
    user: Pick<schema.User, 'id' | 'email' | 'givenName'>;
    labs: Pick<schema.Lab, 'id' | 'name'>[];
  }
</script>

<script lang="ts">
  const { user, labs }: Props = $props();
</script>
```

## No Data Wrapper

Pass props directly to components rather than wrapping in a `data` object:

```svelte
<!-- Good -->
<ChildComponent {...data} />

<!-- Avoid -->
<ChildComponent {data} />
```

## Truthiness over Undefined Checks

Use truthiness checks instead of `typeof !== 'undefined'`:

```svelte
<!-- Good -->
{#if user}
  <span>{user.name}</span>
{/if}

<!-- Avoid -->
{#if typeof user !== 'undefined'}
  <span>{user.name}</span>
{/if}
```

## Import Paths

- **Child-relative imports** (`./component.svelte`) are fine
- **Parent-relative imports** (`../component.svelte`) should use `$lib` paths instead
- **No parent traversal in feature modules:** Within `$lib/features/*/`, never use `../` imports. Use `$lib/features/<feature>/` paths instead.

```ts
// Good (same directory)
import Form from './form.svelte';

// Good (cross-directory in features)
import { SomeComponent } from '$lib/features/drafts/some-component.svelte';

// Avoid (parent traversal)
import Form from '../shared/form.svelte';
```

## Form Actions

Always use **absolute paths** for reusable components:

```svelte
<!-- Good -->
<form method="post" action="/dashboard/drafts/{draftId}/?/start">

<!-- Avoid (relative paths) -->
<form method="post" action="?/start">
```

## Avoid $effect

**Avoid `$effect` wherever possible.** Prefer event handlers and `$derived` for reactive updates:

```svelte
<script>
  let count = $state(0);

  // Good - derived state
  const doubled = $derived(count * 2);

  // Good - event handler
  function increment() {
    count++;
  }
</script>

<!-- Avoid $effect for side effects that can be handled via events -->
```

When you think you need `$effect`, first consider:

1. Can this be a `$derived` value?
2. Can this be triggered by an event handler?
3. Is there a more declarative way to express this?

## MCP Server Usage

Use the `svelte` MCP server for:

- **Documentation lookup**: Query official Svelte 5 and SvelteKit docs
- **Code validation**: Run `svelte-autofixer` on components before finalizing

```
1. List available sections: mcp__svelte__list-sections
2. Get documentation: mcp__svelte__get-documentation
3. Validate code: mcp__svelte__svelte-autofixer
```

Always validate Svelte components through the autofixer before delivering to ensure they follow Svelte 5 patterns.
