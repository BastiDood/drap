<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet';
  import QuotaSnapshotForm from '$lib/features/drafts/timeline/quota-snapshot-form.svelte';
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

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" class="border-warning text-warning" {...props}>
        Eligible for Lottery
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[720px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>Eligible for Lottery</Sheet.Title>
      <Sheet.Description>
        Review quota snapshots and apply manual interventions for undrafted students.
      </Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col gap-6">
      <div class="shrink-0">
        <QuotaSnapshotForm {draftId} mode="lottery" {snapshots} />
      </div>
      <hr class="shrink-0" />
      <div class="flex min-h-0 grow flex-col overflow-y-auto">
        <Loader {draftId} {labs} />
      </div>
    </div>
  </Sheet.Content>
</Sheet.Root>
