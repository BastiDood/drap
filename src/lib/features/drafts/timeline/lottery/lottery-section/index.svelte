<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer';
  import QuotaSnapshotForm from '$lib/features/drafts/timeline/quota-snapshot-form.svelte';
  import { Button } from '$lib/components/ui/button';
  import type { DraftFinalizedBreakdown, Lab } from '$lib/features/drafts/types';

  import Loader from './loader.svelte';

  interface Props {
    draftId: string;
    labs: Pick<Lab, 'id' | 'name'>[];
    snapshots: DraftFinalizedBreakdown['snapshots'];
  }

  const { draftId, labs, snapshots }: Props = $props();
</script>

<Drawer.Root>
  <Drawer.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" class="border-warning text-warning" {...props}>
        Eligible for Lottery
      </Button>
    {/snippet}
  </Drawer.Trigger>
  <Drawer.Content class="min-h-screen">
    <div class="overflow-auto px-8 pb-40">
      <!-- Put QuotaSnapshotForm in Drawer -->
      <QuotaSnapshotForm {draftId} mode="lottery" {snapshots} />
      <hr class="my-8" />
      <!-- Actual Intervention Form -->
      <Loader {draftId} {labs} />
    </div>
  </Drawer.Content>
</Drawer.Root>
