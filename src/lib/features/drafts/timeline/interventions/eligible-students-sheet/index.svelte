<script lang="ts">
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';
  import type { Lab } from '$lib/features/drafts/types';

  import Loader from './loader.svelte';

  interface Props {
    draftId: string;
    labs: Pick<Lab, 'id' | 'name'>[];
  }

  const { draftId, labs }: Props = $props();

  let open = $state(false);
</script>

<Sheet.Root bind:open>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button
        variant="outline"
        class="w-full border-warning text-warning sm:w-auto"
        size="sm"
        {...props}
      >
        <UsersIcon class="size-4" />
        <span>Show Eligible Students</span>
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[720px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>Show Eligible Students</Sheet.Title>
      <Sheet.Description>
        Manually assign undrafted students to labs before running lottery.
      </Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col overflow-y-auto">
      <Loader {draftId} {labs} onSuccess={() => (open = false)} />
    </div>
  </Sheet.Content>
</Sheet.Root>
