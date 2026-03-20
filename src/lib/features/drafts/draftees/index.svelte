<script lang="ts">
  import type { Snippet } from 'svelte';

  import * as Drawer from '$lib/components/ui/drawer';

  import Loader from './loader.svelte';

  interface Props {
    trigger: Snippet;
    draftId: bigint;
    queryKey: string;
    mustShowDrafted?: boolean;
    customTextOnEmpty?: string;
  }

  const { trigger, draftId, queryKey, mustShowDrafted, customTextOnEmpty }: Props = $props();
</script>

<Drawer.Root>
  <Drawer.Trigger>
    {@render trigger()}
  </Drawer.Trigger>
  <Drawer.Content class="min-h-screen">
    <div class="overflow-auto pb-40 px-8">
      <Loader {draftId} {queryKey} {mustShowDrafted} {customTextOnEmpty} />
    </div>
  </Drawer.Content>
</Drawer.Root>