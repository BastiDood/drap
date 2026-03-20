<script lang="ts">
  import * as Drawer from '$lib/components/ui/drawer';
  import { Button } from '$lib/components/ui/button';

  import Loader, { type Props } from './loader.svelte';

  const props: Props = $props();
</script>

<Drawer.Root>
  <Drawer.Trigger>
    {#snippet child({ props })}
      <Button
        variant="outline"
        class="border-secondary bg-secondary/10 h-fit font-mono text-xs uppercase"
        {...props}
      >
        See Interested
      </Button>
    {/snippet}
  </Drawer.Trigger>
  <Drawer.Content class="min-h-screen">
    <div class="overflow-auto px-8 pb-40">
      <Loader {...props} />
    </div>
  </Drawer.Content>
</Drawer.Root>
