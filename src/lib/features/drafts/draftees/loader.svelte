<script lang="ts">
  import { createQuery } from "@tanstack/svelte-query";
  import Loader2Icon from '@lucide/svelte/icons/loader-2';

  import Empty from '$lib/components/ui/empty/empty.svelte';

  import type { Student, SerializableStudent } from "$lib/features/drafts/types";

  import DataTable from './data-table.svelte';

  interface Props {
    draftId: bigint;
    queryKey: string;
    customTextOnEmpty?: string;
  }

  const { draftId, queryKey, customTextOnEmpty }: Props = $props()

  // This only triggers on mount of the parent.
  const { isPending, isError, data } = $derived(createQuery(() => ({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await fetch(`/dashboard/drafts/${draftId}/draftees`);
      const serializedData = await response.json() as SerializableStudent[];
      if (serializedData === undefined) return [];

      return (serializedData.map((draftee) => {
        return {
          ...draftee,

          // Revert non-serializable attributes to original data types
          studentNumber: draftee.studentNumber === null ? null : BigInt(draftee.studentNumber),
        }
      })) as Student[];
    }
  })));
</script>

{#if isPending}
  <div class="flex items-center justify-center h-full">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else}
  <!-- Wrap in a component so we can lazily mount the table state. -->
  <DataTable {data} {customTextOnEmpty} />
{/if}

