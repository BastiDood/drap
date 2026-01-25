# Feature Module Conventions

Feature modules live in `$lib/features/<feature>/`. The main pattern is to wrap related resources and actions within a feature namespace such that implementing new logic or searching existing logic is a simple end-to-end depth-first traversal of the project structure (requiring minimal hopping between sibling subsystems).

## Component Types

### 1. Orchestrator (`*/index.svelte`)

- Conditional rendering based on state
- Imports child components and forwards props
- **Prefer nested conditionals** when deriving UI from state machine conditions

<example title="draft state machine uses nested conditionals">

```svelte
{#if draft.activePeriodEnd !== null}
  <!-- Concluded state -->
  <SummaryPhase {draft} />
{:else if draft.currRound === null}
  <!-- Lottery state -->
  <LotteryPhase {draft} />
{:else if draft.currRound === 0}
  <!-- Registration state -->
  <RegistrationPhase {draft} />
{:else}
  <!-- Regular rounds state -->
  <RegularPhase {draft} />
{/if}
```

</example>

### 2. Form (`*-form.svelte`)

- Self-contained with `use:enhance`
- Absolute action paths (e.g., `/dashboard/drafts/{draftId}/?/start`)
- Runtime assertions over non-null assertions

### 3. Presentation

- Display-only, receives data via props
- Uses `$derived` for computed values

### 4. Dialog Wrapper (`*-dialog.svelte`)

- Wraps a form component to defer mounting until dialog opens
- Ensures form state only initializes when visible
- Parent forwards props to child form

## Dialog Pattern

For dialogs containing forms, split into two components:

```
feature/
├── init-dialog.svelte   # Dialog wrapper (manages open state)
└── init-form.svelte     # Form content (mounted when dialog opens)
```

### Dialog Wrapper (`init-dialog.svelte`)

This component manages the open state of the dialog, and also provides closer methods to the form content if `<Dialog.Close>` is insufficient.

```svelte
<script lang="ts">
  import * as Dialog from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import InitForm, { type Props as FormProps } from './init-form.svelte';

  // Forward all props the child form needs
  type Props = FormProps;
  const props: Props = $props();

  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger asChild let:builder>
    <Button builders={[builder]}>Create Draft</Button>
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Create New Draft</Dialog.Title>
    </Dialog.Header>
    <!-- Only mount form when dialog is open -->
    {#if open}
      <InitForm {...props} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
```

### Form Content (`init-form.svelte`)

This component manages all form state. It is its own component so that state is only mounted conditionally when the dialog content is opened. This prevents us from mounting unnecessary state in the component tree.

```svelte
<script lang="ts" module>
  import type { schema } from '$lib/server/database';

  export interface Props {
    labs: Pick<schema.Lab, 'id' | 'name'>[];
  }
</script>

<script lang="ts">
  import { enhance } from '$app/forms';

  const { labs }: Props = $props();
</script>

<form method="post" action="/dashboard/drafts/?/init" use:enhance>
  <!-- form fields -->
</form>
```

## Props Pattern

Use `Pick<schema.*, 'field1' | 'field2'>` for prop typing:

```ts
export interface Draft extends Pick<schema.Draft, 'id' | 'currRound' | 'maxRounds'> {
  activePeriodEnd: Date | null;
}

interface Props {
  draft: Draft;
  students: Student[];
}

const { draft, students }: Props = $props();
```

## Barrel Exports

Export components from `index.js` (or `index.ts` if type aliases are also exported):

```ts
// src/lib/features/drafts/index.js
export { default as DraftTimeline } from './index.svelte';
export { default as DraftTable } from './draft-table.svelte';
export { default as InitDialog } from './init-dialog.svelte';
```

## Form Action Paths

Always use absolute paths with explicit IDs:

```svelte
<form method="post" action="/dashboard/drafts/{draftId}/?/start">
  <input type="hidden" name="draft" value={draftId} />
</form>
```
