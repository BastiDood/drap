<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import PencilIcon from '@lucide/svelte/icons/pencil';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { sum } from 'd3-array';

  import * as Card from '$lib/components/ui/card';
  import * as Empty from '$lib/components/ui/empty';
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

<Sheet.Root bind:open>
  <Card.Root
    id="quota-card-{mode}"
    class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
  >
    <Card.Header>
      <Card.Title class="flex items-center gap-1.5">
        {#if mode === 'initial'}
          Initial Quota Distribution
        {:else}
          Lottery Quota Distribution
        {/if}
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
      <Card.Action>
        <Sheet.Trigger>
          {#snippet child({ props })}
            {#if hasQuota}
              <Button variant="outline" size="sm" {...props}>
                <PencilIcon class="size-4" />
                <span>Edit Quota</span>
              </Button>
            {:else}
              <Button variant="outline" size="sm" {...props}>
                <PencilIcon class="size-4" />
                <span>Setup Quota</span>
              </Button>
            {/if}
          {/snippet}
        </Sheet.Trigger>
      </Card.Action>
    </Card.Header>
    <Card.Content>
      {#if hasQuota}
        <QuotaPieChart {snapshots} {mode} />
      {:else}
        <Empty.Root class="h-64 w-full">
          <Empty.Media variant="icon" class="bg-warning/15 text-warning">
            <TriangleAlertIcon />
          </Empty.Media>
          <Empty.Header>
            <Empty.Title>No quota data</Empty.Title>
            <Empty.Description>
              Quota distribution will appear once participating lab quotas are configured.
            </Empty.Description>
          </Empty.Header>
        </Empty.Root>
      {/if}
    </Card.Content>
  </Card.Root>
  <Sheet.Content side="right" class="flex w-full flex-col gap-4 p-4 sm:max-w-[720px]">
    <Sheet.Header>
      <Sheet.Title>
        {#if hasQuota}
          Edit Quota
        {:else}
          Setup Quota
        {/if}
      </Sheet.Title>
      <Sheet.Description>
        {#if mode === 'initial'}
          Edit the quota values for each lab. These will be used during regular rounds.
        {:else}
          Edit the lottery quota values for each lab.
        {/if}
      </Sheet.Description>
    </Sheet.Header>
    <QuotaSnapshotForm {draftId} {mode} {snapshots} onSuccess={() => (open = false)} />
  </Sheet.Content>
</Sheet.Root>
