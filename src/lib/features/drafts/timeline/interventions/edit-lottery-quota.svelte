<script lang="ts">
  import BarChart3Icon from '@lucide/svelte/icons/bar-chart-3';

  import * as Sheet from '$lib/components/ui/sheet';
  import QuotaSnapshotForm from '$lib/features/drafts/timeline/quota-snapshot-form.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

  interface Props {
    draftId: string;
    snapshots: DraftLabQuotaSnapshot[];
  }

  const { draftId, snapshots }: Props = $props();

  let open = $state(false);
</script>

<Sheet.Root bind:open>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" size="sm" class="w-full sm:w-auto" {...props}>
        <BarChart3Icon class="size-4" />
        <span>Edit Lottery Quota</span>
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content side="right" class="flex w-full flex-col gap-4 p-4 sm:max-w-[720px]">
    <Sheet.Header>
      <Sheet.Title>Update Draft Quota</Sheet.Title>
      <Sheet.Description>Edit the lottery quota values for each lab.</Sheet.Description>
    </Sheet.Header>
    <QuotaSnapshotForm {draftId} mode="lottery" {snapshots} onSuccess={() => (open = false)} />
  </Sheet.Content>
</Sheet.Root>
