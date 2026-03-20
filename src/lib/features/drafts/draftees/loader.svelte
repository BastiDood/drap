<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/ui/empty/empty.svelte';
  import {
    createFetchDrafteesQuery,
    selectAvailable,
    selectDrafted,
    selectInterested,
  } from '$lib/queries/fetch-draftees';
  import type { Lab } from '$lib/features/drafts/types';

  import DataTable from './data-table.svelte';

  export interface Props {
    draftId: string;
    round?: number;
    lab?: Lab;
    mustShowDrafted?: boolean;
    mustShowInterest?: boolean;
    customTextOnEmpty?: string;
  }

  const { draftId, round, lab, mustShowDrafted, mustShowInterest, customTextOnEmpty }: Props =
    $props();

  const query = $derived(createFetchDrafteesQuery(draftId));

  const data = $derived.by(() => {
    const students = query.data ?? [];

    if (mustShowDrafted === true) return selectDrafted(students, lab);

    if (mustShowDrafted === false && mustShowInterest === true && lab && typeof round === 'number')
      return selectInterested(students, lab, round);

    if (mustShowDrafted === false) return selectAvailable(students, lab, round);

    return students;
  });
</script>

{#if query.isPending}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if query.isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else if typeof query.data !== 'undefined'}
  <!-- Wrap in a component so we can lazily mount the table state. -->
  <DataTable {data} {customTextOnEmpty} />
{/if}
