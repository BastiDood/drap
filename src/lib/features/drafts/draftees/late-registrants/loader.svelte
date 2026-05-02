<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import type { Snippet } from 'svelte';

  import DataTable from '$lib/features/drafts/draftees/data-table.svelte';
  import Empty from '$lib/components/empty.svelte';
  import { createFetchDraftLateRegistrantsQuery } from '$lib/queries/fetch-draft-late-registrants';

  export interface Props {
    draftId: string;
    children?: Snippet;
  }

  const { draftId, children }: Props = $props();

  const query = $derived(createFetchDraftLateRegistrantsQuery(draftId));
</script>

{#if query.isPending}
  <Empty media={{ icon: Loader2Icon, size: 'lg', iconClass: 'animate-spin' }}>
    {#snippet title()}Loading Draftees{/snippet}
    {#snippet description()}Fetching late registrants...{/snippet}
  </Empty>
{:else if query.isError}
  <Empty variant="destructive">
    {#snippet title()}Unable to Load Data{/snippet}
    {#snippet description()}Uh oh! An error has occurred.{/snippet}
  </Empty>
{:else}
  <DataTable data={query.data} {children} />
{/if}
