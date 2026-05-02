<script lang="ts" module>
  export interface Props {
    draftId: string;
    maxRounds: number;
  }
</script>

<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDraftAssignmentsQuery } from '$lib/queries/fetch-draft-assignments';

  import Display from './display.svelte';

  const { draftId, maxRounds }: Props = $props();

  const query = $derived(createFetchDraftAssignmentsQuery(draftId));
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Assignments{/snippet}
    {#snippet description()}Fetching draft assignments...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive">
    {#snippet title()}Unable to Load Data{/snippet}
    {#snippet description()}Uh oh! An error has occurred.{/snippet}
  </Empty>
{:else}
  {@const regularDrafted = query.data.filter(
    ({ round }) => round !== null && round > 0 && round <= maxRounds,
  )}
  {@const interventionDrafted = query.data.filter(
    ({ round }) => round !== null && round === maxRounds + 1,
  )}
  {@const lotteryDrafted = query.data.filter(({ round }) => round === null)}
  <Display {regularDrafted} {interventionDrafted} {lotteryDrafted} />
{/if}
