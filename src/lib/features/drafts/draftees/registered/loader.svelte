<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import type { Snippet } from 'svelte';

  import DataTable from '$lib/features/drafts/draftees/data-table.svelte';
  import Empty from '$lib/components/ui/empty/empty.svelte';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';

  export interface Props {
    draftId: string;
    children?: Snippet;
  }

  const { draftId, children }: Props = $props();

  const query = $derived(createFetchDrafteesQuery(draftId, students => students));
</script>

{#if query.isPending}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if query.isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else if typeof query.data !== 'undefined'}
  <DataTable data={query.data} {children} />
{/if}
