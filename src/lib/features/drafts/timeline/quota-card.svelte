<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import { sum } from 'd3-array';

  import * as Card from '$lib/components/ui/card';
  import * as Popover from '$lib/components/ui/popover';
  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';
  import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

  import QuotaSnapshotForm from './quota-snapshot-form.svelte';

  import QuotaPieChart from './quota-pie-chart/index.svelte';

  interface Props {
    draftId: string;
    mode: 'initial' | 'lottery';
    snapshots: DraftLabQuotaSnapshot[];
  }

  const { draftId, mode, snapshots }: Props = $props();

  let open = $state(false);

  const totalQuota = $derived(
    sum(snapshots, s => (mode === 'initial' ? s.initialQuota : s.lotteryQuota)),
  );

  const hasQuota = $derived(totalQuota > 0);
</script>

<Card.Root
  data-testid={mode === 'initial' ? 'quota-card-initial' : 'quota-card-lottery'}
  class="preset-tonal-muted mx-auto max-w-2xl bg-linear-to-br via-background"
>
  <Card.Header>
    <Card.Title class="flex items-center gap-1.5">
      {mode === 'initial' ? 'Initial Quota Distribution' : 'Lottery Quota Distribution'}
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
    <Card.Description>Current Quota Allocation across Participating Labs</Card.Description>
  </Card.Header>
  <Card.Content>
    <div class="flex flex-col items-center gap-4">
      {#if hasQuota}
        <button
          type="button"
          data-testid={mode === 'initial'
            ? 'quota-pie-chart-button-initial'
            : 'quota-pie-chart-button-lottery'}
          class="group w-full cursor-pointer rounded-md p-4 transition-colors duration-150 hover:bg-muted/30"
          onclick={() => (open = true)}
        >
          <QuotaPieChart {snapshots} {mode} />
          <p
            class="mt-1 text-center text-xs text-muted-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          >
            Click to Edit
          </p>
        </button>
      {:else}
        <Button variant="default" class="w-full max-w-xs" onclick={() => (open = true)}>
          Add Draft Quota
        </Button>
      {/if}
    </div>
  </Card.Content>
</Card.Root>
<Sheet.Root bind:open>
  <Sheet.Content side="right" class="flex w-full flex-col gap-4 p-4 sm:max-w-[720px]">
    <Sheet.Header>
      <Sheet.Title>Update Draft Quota</Sheet.Title>
      <Sheet.Description>
        {mode === 'initial'
          ? 'Edit the quota values for each lab. These will be used during regular rounds.'
          : 'Edit the lottery quota values for each lab.'}
      </Sheet.Description>
    </Sheet.Header>
    <QuotaSnapshotForm {draftId} {mode} {snapshots} onSuccess={() => (open = false)} />
  </Sheet.Content>
</Sheet.Root>
