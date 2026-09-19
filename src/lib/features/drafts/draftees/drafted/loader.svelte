<script lang="ts">
  import Empty from '$lib/components/empty.svelte';
  import DataTable from '$lib/features/drafts/draftees/data-table/index.svelte';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import type { Snippet } from 'svelte';

  export interface Props {
    draftId: string;
    children?: Snippet;
  }

  const { draftId, children }: Props = $props();

  const query = $derived(
    createFetchDrafteesQuery(draftId, students => students.filter(({ labId }) => labId !== null)),
  );
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Draftees{/snippet}
    {#snippet description()}Fetching drafted students...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive">
    {#snippet title()}Unable to Load Data{/snippet}
    {#snippet description()}Uh oh! An error has occurred.{/snippet}
  </Empty>
{:else}
  <DataTable data={query.data} {children} />
{/if}
