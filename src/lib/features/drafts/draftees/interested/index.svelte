<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';

  import Loader, { type Props } from './loader.svelte';

  const props: Props = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button
        variant="outline"
        class="h-fit border-secondary bg-secondary/10 font-mono text-xs uppercase"
        {...props}
      >
        Interested
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[600px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>Interested Students</Sheet.Title>
      <Sheet.Description>
        Review students who ranked this lab for the current round.
      </Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col">
      <Loader {...props} />
    </div>
  </Sheet.Content>
</Sheet.Root>
