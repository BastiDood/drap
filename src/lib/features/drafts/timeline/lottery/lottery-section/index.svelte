<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Drawer from '$lib/components/ui/drawer';

  import type { DraftFinalizedBreakdown, Lab } from '$lib/features/drafts/types';

  import QuotaSnapshotForm from '../../quota-snapshot-form.svelte';
  import Loader from './loader.svelte';

  interface Props {
    draftId: bigint;
    labs: Pick<Lab, 'id' | 'name'>[];
    snapshots: DraftFinalizedBreakdown['snapshots'];
  }

  const { draftId, labs, snapshots }: Props = $props();
</script>

<Drawer.Root>
  <Drawer.Trigger>
    <Button variant="outline" class="border-warning text-warning">Eligible for Lottery</Button>
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
