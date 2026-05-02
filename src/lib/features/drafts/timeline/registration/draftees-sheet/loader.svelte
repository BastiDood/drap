<script lang="ts" module>
  export interface Props {
    draftId: string;
  }
</script>

<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import UsersIcon from '@lucide/svelte/icons/users';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';
  import { createFetchDraftLateRegistrantsQuery } from '$lib/queries/fetch-draft-late-registrants';

  import DrafteesSheetContent from './content.svelte';

  const { draftId }: Props = $props();

  const drafteesQuery = $derived(createFetchDrafteesQuery(draftId));
  const lateQuery = $derived(createFetchDraftLateRegistrantsQuery(draftId));
</script>

{#if drafteesQuery.isPending || lateQuery.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'sm', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Draftees{/snippet}
    {#snippet description()}Fetching registered and late draftees...{/snippet}
  </Empty>
{:else if drafteesQuery.isError || lateQuery.isError}
  <Empty variant="destructive" media={{ icon: UsersIcon, size: 'sm' }}>
    {#snippet title()}Failed to Load Draftees{/snippet}
    {#snippet description()}Please try again in a moment.{/snippet}
  </Empty>
{:else}
  <DrafteesSheetContent draftees={drafteesQuery.data} lateRegistrants={lateQuery.data} />
{/if}
