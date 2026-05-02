# Separate Quota Update from Start Draft — Implementation Plan

> Issue: #170 — Lab snapshot update table/form is confusingly near the "Start Draft" button

## Problem Statement

The `QuotaSnapshotForm` (editable table with submit button) is rendered directly above the `Start Draft` button in both `active.svelte` and `closed.svelte`. Users easily mistake quota updates as part of the "Start Draft" form. The same issue exists in the lottery section where the quota form sits inside the "Eligible for Lottery" sheet.

## Solution Overview

Replace the inline editable table with:

1. A **read-only pie chart** showing quota distribution (always visible)
2. The chart card acts as a **Sheet trigger** — clicking opens a side sheet with the editable form
3. **Flatten** the lottery section — remove the outer sheet, make quota card standalone, give student list its own sheet

---

## Files to Create (2 new files)

### 1. `src/lib/features/drafts/timeline/quota-pie-chart.svelte`

**Purpose:** Read-only pie chart showing quota distribution among labs.

**Props:**

```ts
interface Props {
  snapshots: DraftLabQuotaSnapshot[];
  mode: 'initial' | 'lottery';
}
```

**Data computation:**

- `$derived` block extracts `committedQuota` per lab: `mode === 'initial' ? initialQuota : lotteryQuota`
- `totalQuota` = sum of all committed quotas
- `chartData`: filtered to `quota > 0` only; each entry has `key`, `label` (lab short ID), `labName` (full name), `value` (quota count), `color`
- `chartConfig`: includes ALL labs (even zero-quota). Zero-quota entries use `text-muted-foreground` color for legend distinction
- Percentage per lab: `(quota / totalQuota) * 100`

**All-zero state:**

- When `totalQuota === 0`, render a blank chart area (fixed height, e.g., `h-48`) with a centered `<Badge>"Update Draft Quota"</Badge>` overlay

**Chart rendering:**

- Uses `Chart.Container` from `$lib/components/ui/chart` with `class="max-h-70 w-full"`
- Uses `PieChart` from `layerchart` with `legend={{ orientation: 'vertical', placement: 'right' }}`
- Tooltip via `Chart.Tooltip`:
  - `labelAccessor` → returns `labName`
  - `valueFormatter` → returns `${count} (${percentage}%)`

**Colors:**

- Reuse existing pattern from `lab-distribution-chart.svelte`: `COLORS = ['var(--chart-1)', ..., 'var(--chart-5)']`
- `chartColor(i)` helper with modulo wrapping + assertion

**Imports:**

- `{ PieChart }` from `'layerchart'`
- `* as Card` from `'$lib/components/ui/card'`
- `* as Chart` from `'$lib/components/ui/chart'`
- `{ Badge }` from `'$lib/components/ui/badge'`
- `{ assert }` from `'$lib/assert'`

---

### 2. `src/lib/features/drafts/timeline/quota-card.svelte`

**Purpose:** Self-contained card + sheet wrapper. Always-visible pie chart card; clicking opens sheet with form.

**Props:**

```ts
interface Props {
  draftId: string;
  mode: 'initial' | 'lottery';
  snapshots: DraftLabQuotaSnapshot[];
}
```

**State:**

```ts
let open = $state(false);
```

**Structure:**

```svelte
<Sheet.Root bind:open>
  <Sheet.Trigger asChild>
    <Card.Root class="group relative" variant="soft">
      <Card.Header>
        <Card.Title class="flex items-center gap-1.5">
          {mode === 'initial' ? 'Initial Quota Distribution' : 'Lottery Quota Distribution'}
          <!-- Help Popover -->
          <Popover.Root>
            <Popover.Trigger class="leading-none transition hover:opacity-80">
              <CircleHelpIcon class="size-3.5 text-muted-foreground" />
            </Popover.Trigger>
            <Popover.Content class="max-w-xs space-y-2 text-sm font-normal">
              <p>
                {mode === 'initial'
                  ? 'These values are used during regular rounds and are isolated from lab catalog changes.'
                  : 'These values are used when concluding lottery assignments for this draft only.'}
              </p>
            </Popover.Content>
          </Popover.Root>
        </Card.Title>
        <Card.Description>Current quota allocation across participating labs</Card.Description>
      </Card.Header>

      <Card.Content
        class="cursor-pointer rounded-b-xl transition group-hover:bg-muted/20 hover:ring-2 hover:ring-ring"
      >
        <!-- Hover overlay (appears on card hover) -->
        <div
          class="pointer-events-none absolute inset-0 flex items-center justify-center rounded-b-xl bg-background/60 opacity-0 transition group-hover:opacity-100"
        >
          <Badge variant="outline">Update Draft Quota</Badge>
        </div>
        <QuotaPieChart {snapshots} {mode} />
      </Card.Content>
    </Card.Root>
  </Sheet.Trigger>

  <Sheet.Content side="right" class="flex w-full flex-col overflow-hidden sm:max-w-md">
    <Sheet.Header>
      <Sheet.Title>Update Draft Quota</Sheet.Title>
      <Sheet.Description>
        {mode === 'initial'
          ? 'Edit the quota values for each lab. These will be used during regular rounds.'
          : 'Edit the lottery quota values for each lab.'}
      </Sheet.Description>
    </Sheet.Header>
    <QuotaSnapshotForm
      {draftId}
      {mode}
      {snapshots}
      onSuccess={() => {
        open = false;
      }}
    />
  </Sheet.Content>
</Sheet.Root>
```

**Key details:**

- The `Card.Content` (not the whole card) is the Sheet trigger
- `asChild` on `Sheet.Trigger` forwards `role`, `tabindex`, `onclick` etc. to `Card.Content`
- `cursor-pointer` + `hover:ring-2` + `group` class for hover affordance
- Hover overlay uses `absolute inset-0` with `opacity-0 group-hover:opacity-100` and `bg-background/60` backdrop
- Badge shows `"Update Draft Quota"` text on hover
- `pointer-events-none` on overlay div so clicks pass through to the trigger underneath

---

## Files to Modify (5 source files + tests)

### 3. `src/lib/features/drafts/timeline/quota-snapshot-form.svelte`

**Current state (125 lines):**

- Module script exports `Props` interface
- Wraps everything in `<Card.Root id="draft-quota-editor-{mode}" variant="soft">`
- Contains `<Card.Header>`, `<Card.Title>`, `<Card.Description>`
- Contains `<Card.Content>` with the `<form>` element
- Form uses `use:enhance` with submitter disable/enable logic

**Changes:**

1. **Remove Card wrapper** — delete `<Card.Root>`, `<Card.Header>`, `<Card.Title>`, `<Card.Description>`, `<Card.Content>` tags
2. **Preserve the `id`** — move `id="draft-quota-editor-{mode}"` onto the `<form>` element itself (required by tests)
3. **Add `onSuccess` prop** to the module script:
   ```ts
   export interface Props {
     draftId: string;
     mode: 'initial' | 'lottery';
     snapshots: DraftLabQuotaSnapshot[];
     onSuccess?: () => void;
   }
   ```
4. **Call `onSuccess` in success branch** of `use:enhance`:
   ```ts
   case 'success':
     toast.success(
       mode === 'initial'
         ? 'Initial quota snapshots updated.'
         : 'Lottery quota snapshots updated.',
     );
     onSuccess?.();
     break;
   ```
5. **Submit button** — keep mode-specific text (`"Update Initial Snapshots"` / `"Update Lottery Snapshots"`)
6. **Spinner on submit** — replace button text with `Loader2Icon` when disabled:
   ```svelte
   <Button type="submit" variant="outline" class="w-full">
     {#if isSubmitting}
       <Loader2Icon class="size-4 animate-spin" />
     {:else}
       {mode === 'initial' ? 'Update Initial Snapshots' : 'Update Lottery Snapshots'}
     {/if}
   </Button>
   ```
   Where `isSubmitting` is tracked via `$state` and set in `use:enhance`.
7. **Sticky footer wrapper** — the form's content needs a sticky footer for the submit button:
   ```svelte
   <form class="flex min-h-0 grow flex-col overflow-hidden" ...>
     <div class="grow overflow-y-auto px-4 pb-4">
       <!-- table inputs -->
     </div>
     <div class="shrink-0 border-t bg-background px-4 py-4">
       <!-- submit button -->
     </div>
   </form>
   ```

**Imports to add:**

- `Loader2Icon` from `@lucide/svelte/icons/loader-2`

---

### 4. `src/lib/features/drafts/timeline/registration/active.svelte`

**Current imports:**

```ts
import QuotaSnapshotForm from '$lib/features/drafts/timeline/quota-snapshot-form.svelte';
```

**Changes:**

1. Replace import: `import QuotaCard from '$lib/features/drafts/timeline/quota-card.svelte';`
2. Replace usage at line 38:
   ```svelte
   - <QuotaSnapshotForm {draftId} mode="initial" {snapshots} />
   + <QuotaCard {draftId} mode="initial" {snapshots} />
   ```
3. Add help popover to "Registered Students" heading — collapse the two prose paragraphs into a single `CircleHelpIcon` popover:
   ```svelte
   <h3 class="flex items-center gap-1.5">
     Registered Students
     <Popover.Root>
       <Popover.Trigger class="leading-none transition hover:opacity-80">
         <CircleHelpIcon class="size-3.5 text-muted-foreground" />
       </Popover.Trigger>
       <Popover.Content class="max-w-sm space-y-2 text-sm font-normal">
         <p>
           There are currently <strong>{studentCount}</strong> students who have registered for this
           draft. Press the <strong>"Start Draft"</strong> button to close registration and start the
           draft automation.
         </p>
         <p>
           Lab heads will be notified when the first round begins. The draft proceeds to the next
           round when all lab heads have submitted their preferences. This process repeats until the
           configured maximum number of rounds has elapsed, after which the draft pauses until an
           administrator <em>manually</em> proceeds with the lottery stage.
         </p>
       </Popover.Content>
     </Popover.Root>
   </h3>
   ```
4. Keep the student count text as a simple paragraph (not inside the popover)

**Imports to add:**

- `CircleHelpIcon` from `@lucide/svelte/icons/circle-help`
- `* as Popover` from `'$lib/components/ui/popover'`

---

### 5. `src/lib/features/drafts/timeline/registration/closed.svelte`

**Changes:** Same pattern as `active.svelte`:

1. Replace `QuotaSnapshotForm` import with `QuotaCard`
2. Replace `<QuotaSnapshotForm>` with `<QuotaCard mode="initial">`
3. Add help popover to "Registered Students" heading (same text or slightly adapted for closed state)

---

### 6. `src/lib/features/drafts/timeline/lottery/lottery-section/index.svelte`

**Current structure:**

```svelte
<Sheet.Root>
  <Sheet.Trigger> → "Eligible for Lottery" button
  <Sheet.Content>
    <QuotaSnapshotForm mode="lottery" />
    <hr />
    <Loader />
  </Sheet.Content>
</Sheet.Root>
```

**New structure:**

```svelte
<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet';
  import QuotaCard from '$lib/features/drafts/timeline/quota-card.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { DraftLabQuotaSnapshot, Lab } from '$lib/features/drafts/types';
  import Loader from './loader.svelte';

  interface Props {
    draftId: string;
    labs: Pick<Lab, 'id' | 'name'>[];
    snapshots: DraftLabQuotaSnapshot[];
  }

  const { draftId, labs, snapshots }: Props = $props();
</script>

<div class="space-y-4">
  <!-- Quota card standalone on page -->
  <QuotaCard {draftId} mode="lottery" {snapshots} />

  <!-- Separate sheet for student list only -->
  <Sheet.Root>
    <Sheet.Trigger>
      {#snippet child({ props })}
        <Button variant="outline" class="border-warning text-warning" {...props}>
          Eligible for Lottery
        </Button>
      {/snippet}
    </Sheet.Trigger>
    <Sheet.Content side="right" class="flex w-full flex-col overflow-hidden sm:max-w-[600px]">
      <Sheet.Header>
        <Sheet.Title>Eligible for Lottery</Sheet.Title>
        <Sheet.Description>
          Review and manually intervene for undrafted students before running the lottery.
        </Sheet.Description>
      </Sheet.Header>
      <div class="flex min-h-0 grow flex-col overflow-y-auto px-4 pb-4">
        <Loader {draftId} {labs} />
      </div>
    </Sheet.Content>
  </Sheet.Root>
</div>
```

**Key changes:**

- Removed outer `Sheet.Root` wrapper
- `QuotaCard` is a standalone card on the page (clickable → opens its own sheet)
- New inner `Sheet.Root` wraps only the student list
- Updated description: removed quota reference ("Review quota snapshots and apply manual interventions..." → "Review and manually intervene for undrafted students...")
- Width changed from `sm:max-w-[720px]` to `sm:max-w-[600px]` (no longer needs to fit the quota form)

---

### 7. `tests/draft.test.ts`

**7 test blocks to rewrite:**

#### A. Initial quota tests (4 blocks)

These currently find `#draft-quota-editor-initial` visible on the page directly.

**New interaction pattern:**

1. Click the quota card (can use `getByRole('heading', { name: 'Initial Quota Distribution' }).click()` or click the card itself)
2. Wait for Sheet to open
3. Find `#draft-quota-editor-initial` inside the Sheet
4. Interact with inputs + submit button
5. Assert Sheet closes on success (new test)

**Affected tests:**

- Line 783: `shows initial snapshot quotas as placeholders`
- Line 798: `updates initial snapshots`
- Line 816: `shows committed placeholders after update`
- Line 2583: `updates Draft #2 initial snapshots before start`

#### B. Lottery quota tests (3 blocks)

These currently click `"Eligible for Lottery"` button → find `#draft-quota-editor-lottery` inside the resulting sheet.

**New interaction pattern:**

1. Click the lottery quota card (heading: `"Lottery Quota Distribution"`)
2. Wait for Sheet to open
3. Find `#draft-quota-editor-lottery` inside the Sheet
4. Interact with inputs + submit button

**Affected tests:**

- Line 1775: `partially updates lottery snapshots`
- Line 1796: `shows committed placeholders after lottery snapshot update`
- Line 2769: `sets lottery snapshots to zero for Draft #2`

#### C. New tests to add

1. **Pie chart renders** — verify `PieChart` SVG elements are visible on the quota card
2. **Hover tooltip** — hover on a chart slice, assert tooltip shows `Lab Name → 9 (9%)` format
3. **Sheet auto-closes** — submit the form, assert sheet closes after success response
4. **Zero-quota badge** — when all quotas are 0, assert `"Update Draft Quota"` badge is visible

---

## Implementation Order

1. **`quota-snapshot-form.svelte`** — refactor first (add `onSuccess`, remove Card wrapper, add sticky footer + spinner). This is the foundational change that other files depend on.
2. **`quota-pie-chart.svelte`** — create the pie chart component.
3. **`quota-card.svelte`** — create the sheet wrapper that combines the pie chart + form.
4. **`registration/active.svelte`** — swap in `QuotaCard`, add help popover.
5. **`registration/closed.svelte`** — same changes.
6. **`lottery/lottery-section/index.svelte`** — flatten structure.
7. **`tests/draft.test.ts`** — rewrite 7 test blocks + add 4 new tests.
8. **`pnpm lint && pnpm fmt:fix`** — verify no lint/format errors.
9. **`pnpm test:unit`** — run unit tests.
10. **`pnpm build && pnpm test:playwright`** — build and run e2e tests.

---

## Acceptance Criteria Mapping

| Criteria                                          | How Met                                                                                    |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Quota update gated behind Sheet.Trigger           | `quota-card.svelte` — `Card.Content` is a `Sheet.Trigger`                                  |
| Auto-close on success                             | `onSuccess={() => open = false}` passed from `QuotaCard` to form                           |
| Read-only pie chart replaces table                | `quota-pie-chart.svelte` with legend, percentages, labels, hover tooltips                  |
| Zero-quota labs in legend but filtered from chart | `chartData` filtered by `quota > 0`; `chartConfig` includes all labs with muted styling    |
| All-zero state shows badge                        | Conditional rendering in pie chart: blank area + `"Update Draft Quota"` badge              |
| Progressive disclosure via subtitles + popovers   | `CircleHelpIcon` popovers on both the quota card and "Registered Students" heading         |
| Chart only updates on submission                  | Chart reads from `snapshots` prop; parent only re-queries after successful form submission |
| Lottery section flattened                         | Outer Sheet removed; `QuotaCard` standalone + separate Sheet for student list              |
| Submit button replaced with spinner               | `Loader2Icon` with `animate-spin` shown when `isSubmitting`                                |

---

## Risk Areas

1. **Sheet primitive `asChild` behavior** — need to verify bits-ui properly forwards `role="button"` and `tabindex` when `asChild` wraps `Card.Content`. If it doesn't, add explicit `role="button"` and `tabindex={0}` attributes, plus `onkeydown` for Enter/Space activation.
2. **Form submit inside Sheet** — the sticky footer approach requires the form to be the scroll container. Need to ensure `overflow-hidden` on the Sheet content and `overflow-y-auto` on the table area work together.
3. **Chart color uniqueness** — with 5 CSS variable colors and potentially more than 5 labs, the modulo approach wraps. Verify this matches `lab-distribution-chart.svelte` behavior.
4. **Test locator changes** — tests currently use `#draft-quota-editor-{mode}`. Since this moves from a `Card.Root` to a `<form>`, verify the selector still works (it should since we preserve the `id` on the form element).
