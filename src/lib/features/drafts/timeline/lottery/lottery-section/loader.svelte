<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
  import { toast } from 'svelte-sonner';

  import Empty from '$lib/components/ui/empty/empty.svelte';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
  import { createFetchDrafteesQuery } from '$lib/queries/fetch-draftees';
  import { enhance } from '$app/forms';
  import type { Lab } from '$lib/features/drafts/types';

  import DataTable from './data-table.svelte';

  interface Props {
    draftId: string;
    labs: Pick<Lab, 'id' | 'name'>[];
  }

  const { draftId, labs }: Props = $props();

  const query = $derived(
    createFetchDrafteesQuery(draftId, students => students.filter(({ labId }) => labId === null)),
  );
</script>

{#if query.isPending}
  <div class="flex h-full items-center justify-center">
    <Loader2Icon class="size-20 animate-spin" />
  </div>
{:else if query.isError}
  <Empty>Uh oh! An error has occurred.</Empty>
{:else if query.data.length > 0}
  <form
    method="post"
    action="/dashboard/drafts/{draftId}/?/intervene"
    class="space-y-4"
    use:enhance={({ submitter, cancel }) => {
      // eslint-disable-next-line no-alert
      if (!confirm('Are you sure you want to apply these interventions?')) {
        cancel();
        return;
      }
      assert(submitter !== null);
      assert(submitter instanceof HTMLButtonElement);
      submitter.disabled = true;
      return async ({ update, result }) => {
        submitter.disabled = false;
        await update();
        if (result.type === 'success') toast.success('Successfully applied the interventions.');
        await query.refetch();
      };
    }}
  >
    <!-- Wrap in a component so we can lazily mount the table state. -->
    <DataTable data={query.data} {labs} />
    <input type="hidden" name="draft" value={draftId} />
    <Button
      type="submit"
      variant="outline"
      size="lg"
      class="border-warning bg-warning/10 text-warning hover:bg-warning/20 w-full shadow-lg"
    >
      <ShieldAlertIcon class="size-6" />
      <span>Apply Interventions</span>
    </Button>
  </form>
{:else}
  <p class="prose dark:prose-invert max-w-none">
    Congratulations! All participants have been drafted. No action is needed here.
  </p>
{/if}
