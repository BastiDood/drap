<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import AvailableLoader from '$lib/features/drafts/draftees/available/loader.svelte';
  import DraftedLoader from '$lib/features/drafts/draftees/drafted/loader.svelte';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  interface Props {
    draftId: string;
  }

  const { draftId }: Props = $props();

  let selectedView = $state<'pending' | 'drafted'>('pending');
</script>

<div class="mb-2 flex justify-center xs:justify-start">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          variant="outline"
          class="bg-background hover:bg-accent dark:bg-input dark:hover:bg-input/80"
          {...props}
        >
          <ChevronDownIcon class="size-4 text-muted-foreground transition-transform" />
          {selectedView === 'pending' ? 'Pending Selection' : 'Already Drafted'}
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="start">
      <DropdownMenu.Item onclick={() => (selectedView = 'pending')}>
        <span>Pending Selection</span>
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={() => (selectedView = 'drafted')}>
        <span>Already Drafted</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>

{#if selectedView === 'pending'}
  <span class="text-sm text-muted-foreground"
    >Review undrafted students available for selection.</span
  >
  <div class="flex min-h-0 grow flex-col overflow-y-auto px-4 pb-4">
    <AvailableLoader {draftId}>No available draftees.</AvailableLoader>
  </div>
{:else}
  <span class="text-sm text-muted-foreground">Review students who have already been assigned.</span>
  <div class="flex min-h-0 grow flex-col overflow-y-auto px-4 pb-4">
    <DraftedLoader {draftId}>No drafted students yet.</DraftedLoader>
  </div>
{/if}
