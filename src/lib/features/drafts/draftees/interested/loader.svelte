<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/ui/empty/empty.svelte';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';
  import type { Lab } from '$lib/features/drafts/types';

  import DataTable from '$lib/features/drafts/draftees/data-table.svelte';

  export interface Props {
    draftId: string;
    round: number;
    lab: Lab;
    customTextOnEmpty?: string;
  }

  const { draftId, round, lab, customTextOnEmpty }: Props = $props();

  const query = $derived(
    createFetchDrafteesQuery(draftId, students =>
      students
        .filter(({ labId }) => labId === null)
        .filter(student => student.labs.slice(round).includes(lab.id)),
    ),
  );
</script>

{#if query.isPending}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if query.isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else if typeof query.data !== 'undefined'}
  <DataTable data={query.data} {customTextOnEmpty} />
{/if}
