<script lang="ts">
  import { Progress } from '@skeletonlabs/skeleton-svelte';
  import SubmitRankings from './SubmitRankings.svelte';
  import WarningAlert from '$lib/alerts/Warning.svelte';
  import { format } from 'date-fns';

  const { data } = $props();
  const {
    draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
    availableLabs,
    rankings,
  } = $derived(data);
</script>

{#if currRound === null}
  <WarningAlert
    >A lottery is currently ongoing. You may join again soon in the next draft.</WarningAlert
  >
{:else if currRound > 0}
  <WarningAlert>A draft is currently ongoing. You may no longer register.</WarningAlert>
  <Progress max={maxRounds} value={currRound} meterBg="bg-primary-700-300" />
{:else if typeof rankings === 'undefined'}
  {#if new Date() < registrationClosesAt}
    <SubmitRankings {draftId} {maxRounds} {availableLabs} />
  {:else}
    {@const closeDate = format(registrationClosesAt, 'PPP')}
    {@const closeTime = format(registrationClosesAt, 'pp')}
    <WarningAlert
      >Registration for the current draft closed on <strong>{closeDate}</strong> at
      <strong>{closeTime}</strong>. You may no longer register.</WarningAlert
    >
  {/if}
{:else}
  {@const { createdAt, labRemarks } = rankings}
  {@const creationDate = format(createdAt, 'PPP')}
  {@const creationTime = format(createdAt, 'pp')}
  <div
    class="card preset-tonal-secondary border-secondary-500 prose dark:prose-invert max-w-none border p-4"
  >
    <p>
      You have already submitted your lab preferences for this draft last <strong
        >{creationDate}</strong
      >
      at
      <strong>{creationTime}</strong>.
    </p>
    {#if labRemarks.length > 0}
      <ol>
        {#each labRemarks as { lab, remark } (lab)}
          <li>
            {lab}
            {#if remark.length > 0}
              <p class="text-sm">
                <strong>Remarks:</strong>
                {remark}
              </p>
            {/if}
          </li>
        {/each}
      </ol>
    {:else}
      <p>You have selected none of the labs. You will thus skip ahead to the lottery phase.</p>
    {/if}
  </div>
{/if}
