<script lang="ts">
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';

  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';

  import Loader from './loader.svelte';

  interface Props {
    draftId: string;
  }

  const { draftId }: Props = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" size="sm" class="w-full sm:w-auto" {...props}>
        <ListChecksIcon class="size-4" />
        <span>View Results</span>
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[720px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>Lottery Results</Sheet.Title>
      <Sheet.Description>Review lottery-placed students and assigned labs.</Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col">
      <Loader {draftId} />
    </div>
  </Sheet.Content>
</Sheet.Root>
