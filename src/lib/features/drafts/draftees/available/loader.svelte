<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import type { Snippet } from 'svelte';

  import DataTable from '$lib/features/drafts/draftees/data-table.svelte';
  import Empty from '$lib/components/empty.svelte';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';
  import type { Lab } from '$lib/features/drafts/types';

  export interface Props {
    draftId: string;
    round?: number;
    lab?: Lab;
    children?: Snippet;
  }

  const { draftId, round, lab, children }: Props = $props();

  const query = $derived(
    createFetchDrafteesQuery(draftId, students => {
      const available = students.filter(({ labId }) => labId === null);
      if (typeof lab === 'undefined' || typeof round === 'undefined') return available;
      return available.filter(student => student.labs[round - 1] === lab.id);
    }),
  );
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Draftees{/snippet}
    {#snippet description()}Fetching available draftees...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive">
    {#snippet title()}Unable to Load Data{/snippet}
    {#snippet description()}Uh oh! An error has occurred.{/snippet}
  </Empty>
{:else}
  <DataTable data={query.data} {children} />
{/if}
