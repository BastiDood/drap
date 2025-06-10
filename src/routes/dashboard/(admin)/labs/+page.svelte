<script lang="ts">
  import WarningAlert from '$lib/alerts/Warning.svelte';
  import { format } from 'date-fns';

  import CreateForm from './CreateForm.svelte';
  import QuotaForm from './QuotaForm.svelte';

  // eslint-disable-next-line
  export let data;
  $: ({ draft, labs } = data);
</script>

{#if typeof draft === 'undefined' || draft.currRound === null}
  <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[56ch_1fr]">
    <CreateForm />
    <QuotaForm {labs} />
  </div>
{:else if draft.currRound === 0}
  <QuotaForm {labs} />
{:else}
  {@const { id: draftId, activePeriodStart, currRound, maxRounds } = draft}
  {@const startDate = format(activePeriodStart, 'PPP')}
  {@const startTime = format(activePeriodStart, 'pp')}
  <WarningAlert>
    <span>
      <strong>Draft &num;{draftId}</strong> started last <strong>{startDate}</strong> at
      <strong>{startTime}</strong> and is now in Round <strong>{currRound}</strong> of
      <strong>{maxRounds}</strong>. It's unsafe to update the lab quota while a draft is in
      progress.
    </span>
  </WarningAlert>
{/if}
