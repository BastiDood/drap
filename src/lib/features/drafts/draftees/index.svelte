<script lang="ts">
  import type { Snippet } from 'svelte';

  import * as Drawer from '$lib/components/ui/drawer';
  import type { Lab } from '$lib/features/drafts/types';

  import Loader from './loader.svelte';

  interface Props {
    trigger: Snippet;
    draftId: bigint;
    round?: number;
    lab?: Lab;
    queryKey: string;
    mustShowDrafted?: boolean;
    mustShowInterest?: boolean;
    customTextOnEmpty?: string;
  }

  const {
    trigger,
    draftId,
    round,
    lab,
    queryKey,
    mustShowDrafted,
    mustShowInterest,
    customTextOnEmpty,
  }: Props = $props();
</script>

<Drawer.Root>
  <Drawer.Trigger>
    {@render trigger()}
  </Drawer.Trigger>
  <Drawer.Content class="min-h-screen">
    <div class="overflow-auto px-8 pb-40">
      <Loader
        {draftId}
        {round}
        {lab}
        {queryKey}
        {mustShowDrafted}
        {mustShowInterest}
        {customTextOnEmpty}
      />
    </div>
  </Drawer.Content>
</Drawer.Root>
