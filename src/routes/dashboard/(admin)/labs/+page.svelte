<script lang="ts">
  import WarningAlert from '$lib/alerts/Warning.svelte';
  import { format } from 'date-fns';

  import CreateForm from './CreateForm.svelte';
  import QuotaForm from './QuotaForm.svelte';
  import RestoreForm from './RestoreForm.svelte';

  const { data } = $props();
  const { draft, labs } = $derived(data);

  let deletedLabs = $derived(labs.filter(lab => lab.deletedAt !== null));
  let activeLabs = $derived(labs.filter(lab => lab.deletedAt === null));

  let isRestoreFormVisible = $state(false);
</script>

{#if typeof draft === 'undefined' || draft.currRound === null}
  <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[56ch_1fr]">
    <CreateForm />
    <div class="flex w-full flex-col gap-y-4">
      <label
        class="btn preset-filled-surface-500 flex w-48 cursor-pointer items-center"
        for="see-deleted"
      >
        <input
          class="hidden"
          type="checkbox"
          name="see-deleted"
          id="see-deleted"
          bind:checked={isRestoreFormVisible}
        />
        {#if isRestoreFormVisible}
          <p>Set Lab Quotas</p>
        {:else}
          <p>See Deleted Labs</p>
        {/if}
      </label>
      {#if isRestoreFormVisible}
        <RestoreForm {deletedLabs} />
      {:else}
        <QuotaForm {activeLabs} isDeleteAllowed={true} />
      {/if}
    </div>
  </div>
{:else if draft.currRound === 0}
  <QuotaForm {activeLabs} isDeleteAllowed={false} />
{:else}
  {@const { id: draftId, activePeriodStart, currRound, maxRounds } = draft}
  {@const startDate = format(activePeriodStart, 'PPP')}
  {@const startTime = format(activePeriodStart, 'pp')}
  <WarningAlert>
    <span>
      <strong>Draft #{draftId}</strong> started last <strong>{startDate}</strong> at
      <strong>{startTime}</strong> and is now in Round <strong>{currRound}</strong> of
      <strong>{maxRounds}</strong>. It's unsafe to update the lab quota while a draft is in
      progress.
    </span>
  </WarningAlert>
{/if}
