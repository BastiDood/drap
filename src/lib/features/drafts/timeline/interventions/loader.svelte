<script lang="ts">
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/empty.svelte';
  import { createFetchDraftInterventionsAggregateQuery } from '$lib/queries/fetch-draft-interventions-aggregate';
  import type { DraftLabQuotaSnapshot, Lab } from '$lib/features/drafts/types';

  import InterventionsActive from './active.svelte';

  interface Props {
    draftId: string;
    labs: Pick<Lab, 'id' | 'name'>[];
    snapshots: DraftLabQuotaSnapshot[];
    isHistorical: boolean;
  }

  const { draftId, labs, snapshots, isHistorical }: Props = $props();

  const query = $derived(createFetchDraftInterventionsAggregateQuery(draftId));
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Interventions{/snippet}
    {#snippet description()}Fetching intervention aggregate...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive" media={{ icon: CircleAlertIcon, size: 'lg' }}>
    {#snippet title()}Unable to Load Interventions{/snippet}
    {#snippet description()}Please try again in a moment.{/snippet}
  </Empty>
{:else if typeof query.data !== 'undefined'}
  <InterventionsActive {draftId} {labs} {snapshots} rows={query.data.dumbbellRows} {isHistorical} />
{/if}
