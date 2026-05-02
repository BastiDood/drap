<script lang="ts">
  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';

  import DrafteesSheetLoader from './loader.svelte';

  interface Props {
    draftId: string;
  }

  const { draftId }: Props = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" class="gap-2" {...props}>View All Draftees</Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[600px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>All Draftees</Sheet.Title>
      <Sheet.Description>Browse registered and late draftees for this draft.</Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col">
      <DrafteesSheetLoader {draftId} />
    </div>
  </Sheet.Content>
</Sheet.Root>
