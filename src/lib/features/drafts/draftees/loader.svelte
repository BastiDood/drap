<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import { createQuery } from '@tanstack/svelte-query';

  import Empty from '$lib/components/ui/empty/empty.svelte';
  import type { Lab, SerializableStudent, Student } from '$lib/features/drafts/types';

  import DataTable from './data-table.svelte';

  interface Props {
    draftId: bigint;
    round?: number;
    lab?: Lab;
    queryKey: string;
    mustShowDrafted?: boolean;
    mustShowInterest?: boolean;
    customTextOnEmpty?: string;
  }

  const {
    draftId,
    round,
    lab,
    queryKey,
    mustShowDrafted,
    mustShowInterest,
    customTextOnEmpty,
  }: Props = $props();

  // This only triggers on mount of the parent.
  const { isPending, isError, data } = $derived(
    createQuery(() => ({
      queryKey: [queryKey, draftId.toString()],
      async queryFn() {
        const response = await fetch(`/dashboard/drafts/${draftId}/draftees`);
        const serializedData = (await response.json()) as SerializableStudent[];
        if (typeof serializedData === 'undefined') return [];

        const data = serializedData.map(draftee => {
          return {
            ...draftee,

            // Revert non-serializable attributes to original data types
            studentNumber: draftee.studentNumber === null ? null : BigInt(draftee.studentNumber),
          };
        }) as Student[];

        // Return only those who are

        // drafted
        if (mustShowDrafted === true) {
          const drafted = data.filter(({ labId }) => labId !== null);

          // specific to a lab
          if (typeof lab !== 'undefined') return drafted.filter(d => d.labId === lab.id);

          return drafted;
        }

        // still available for lab draft
        else if (mustShowDrafted === false) {
          const available = data.filter(({ labId }) => labId === null);

          // interested in a lab
          if (typeof lab !== 'undefined')
            if (typeof round !== 'undefined') {
              // later
              if (mustShowInterest === true)
                return available.filter(d => d.labs.slice(round).includes(lab.id));

              // or right now
              return available.filter(d => d.labs[round - 1] === lab.id);
            }

          return available;
        }

        // Return everything
        return data;
      },
    })),
  );
</script>

{#if isPending}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else}
  <!-- Wrap in a component so we can lazily mount the table state. -->
  <DataTable {data} {customTextOnEmpty} />
{/if}
