<script lang="ts" module>
  import type { Lab } from '$lib/features/drafts/types';

  export interface Props {
    draftId: string;
    round: number;
    labs: Lab[];
  }
</script>

<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';

  import UndraftedDrawerContent from './content.svelte';

  const { draftId, round, labs }: Props = $props();

  const query = $derived(
    createFetchDrafteesQuery(draftId, students => students.filter(({ labId }) => labId === null)),
  );
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Draftees{/snippet}
    {#snippet description()}Fetching undrafted students...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive">
    {#snippet title()}Unable to Load Data{/snippet}
    {#snippet description()}Uh oh! An error has occurred.{/snippet}
  </Empty>
{:else}
  <UndraftedDrawerContent {round} {labs} students={query.data} />
{/if}
