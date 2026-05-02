<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';
  import type { Lab } from '$lib/features/drafts/types';

  import Loader from './loader.svelte';

  interface Props {
    draftId: string;
    lab: Lab;
  }

  const { draftId, lab }: Props = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button
        variant="outline"
        class="h-fit border-primary bg-primary/10 font-mono text-xs uppercase"
        {...props}>Members</Button
      >
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[600px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>Lab Members</Sheet.Title>
      <Sheet.Description>Review students who have already been assigned.</Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col">
      <Loader {draftId} {lab} />
    </div>
  </Sheet.Content>
</Sheet.Root>
