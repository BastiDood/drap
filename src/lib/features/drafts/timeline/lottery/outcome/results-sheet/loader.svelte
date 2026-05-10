<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDraftAssignmentsQuery } from '$lib/queries/fetch-draft-assignments';

  import LotteryResultsTable from './table.svelte';

  interface Props {
    draftId: string;
  }

  const { draftId }: Props = $props();

  const query = $derived(
    createFetchDraftAssignmentsQuery(draftId, assignments =>
      assignments.filter(({ round }) => round === null),
    ),
  );
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Lottery Results{/snippet}
    {#snippet description()}Fetching lottery assignments...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive">
    {#snippet title()}Unable to Load Data{/snippet}
    {#snippet description()}Uh oh! An error has occurred.{/snippet}
  </Empty>
{:else}
  <LotteryResultsTable assignments={query.data} />
{/if}
