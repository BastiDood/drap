<script lang="ts">
  import type { Snippet } from 'svelte';

  import * as Drawer from '$lib/components/ui/drawer';

  import Loader, { type Props as LoaderProps } from './loader.svelte';

  interface Props extends LoaderProps {
    trigger: Snippet<[Record<string, unknown>]>;
  }

  const {
    trigger,
    draftId,
    round,
    lab,
    mustShowDrafted,
    mustShowInterest,
    customTextOnEmpty,
  }: Props = $props();
</script>

<Drawer.Root>
  <Drawer.Trigger>
    {#snippet child({ props })}
      {@render trigger(props)}
    {/snippet}
  </Drawer.Trigger>
  <Drawer.Content class="min-h-screen">
    <div class="overflow-auto px-8 pb-40">
      <Loader {draftId} {round} {lab} {mustShowDrafted} {mustShowInterest} {customTextOnEmpty} />
    </div>
  </Drawer.Content>
</Drawer.Root>
