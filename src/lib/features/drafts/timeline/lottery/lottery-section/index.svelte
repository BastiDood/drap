<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Drawer from '$lib/components/ui/drawer';

  import type { Lab } from '$lib/features/drafts/types';

  import Loader from './loader.svelte';

  interface Props {
    draftId: bigint;
    labs: Pick<Lab, 'id' | 'name'>[];
  }

  const { draftId, labs }: Props = $props();
</script>

<Drawer.Root>
  <Drawer.Trigger>
    <Button variant="outline" class="border-warning text-warning">
      Eligible for Lottery
    </Button>
  </Drawer.Trigger>
  <Drawer.Content class="min-h-screen">
    <div class="overflow-auto pb-40 px-8">
      <Loader {draftId} {labs} />
    </div>
  </Drawer.Content>
</Drawer.Root>