<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDraftAssignmentSummaryQuery } from '$lib/queries/fetch-draft-assignment-summary';
  import type { DraftAssignmentSummary, Lab } from '$lib/features/drafts/types';

  import RegularPhase from './index.svelte';

  interface Props {
    draftId: string;
    requestedAt: Date;
    round: number;
    labs: Lab[];
    showUndrafted: boolean;
    initialAssignmentSummary?: DraftAssignmentSummary | null;
  }

  const { draftId, requestedAt, round, labs, showUndrafted, initialAssignmentSummary }: Props =
    $props();

  const query = $derived(createFetchDraftAssignmentSummaryQuery(draftId, initialAssignmentSummary));
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Regular Rounds{/snippet}
    {#snippet description()}Fetching assignment summary...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive" media={{ icon: CircleAlertIcon, size: 'lg' }}>
    {#snippet title()}Unable to Load Regular Rounds{/snippet}
    {#snippet description()}Please try again in a moment.{/snippet}
  </Empty>
{:else if typeof query.data !== 'undefined'}
  <RegularPhase
    {draftId}
    {requestedAt}
    {round}
    {labs}
    {showUndrafted}
    assignmentSummary={query.data}
  />
{/if}
