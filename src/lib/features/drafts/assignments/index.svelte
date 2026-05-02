<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';

  import Loader, { type Props } from './loader.svelte';

  const loaderProps: Props = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button {...props}>See Results</Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content side="right" class="flex min-w-[50%] flex-col gap-4 overflow-hidden p-4">
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>Draft Assignments</Sheet.Title>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col overflow-y-auto">
      <Loader {...loaderProps} />
    </div>
  </Sheet.Content>
</Sheet.Root>
