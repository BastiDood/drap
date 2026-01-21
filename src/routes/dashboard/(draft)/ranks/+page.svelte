<script lang="ts">
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import * as Card from '$lib/components/ui/card';
  import { Progress } from '$lib/components/ui/progress';

  import SubmitRankings from './submit-rankings.svelte';

  const { data } = $props();
  const {
    draft: { id: draftId, currRound, maxRounds, registrationClosesAt },
    availableLabs,
    rankings,
    requestedAt,
  } = $derived(data);
</script>

{#if currRound === null}
  <Alert.Root variant="warning">
    <TriangleAlert />
    <Alert.Description
      >A lottery is currently ongoing. You may join again soon in the next draft.</Alert.Description
    >
  </Alert.Root>
{:else if currRound > 0}
  <Alert.Root variant="warning">
    <TriangleAlert />
    <Alert.Description>A draft is currently ongoing. You may no longer register.</Alert.Description>
  </Alert.Root>
  <Progress max={maxRounds} value={currRound} />
{:else if typeof rankings !== 'undefined'}
  {@const { createdAt, labRemarks } = rankings}
  {@const creationDate = format(createdAt, 'PPP')}
  {@const creationTime = format(createdAt, 'pp')}
  <Card.Root class="border-secondary bg-secondary/10">
    <Card.Content class="prose dark:prose-invert max-w-none pt-6">
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
    </Card.Content>
  </Card.Root>
{:else if requestedAt < registrationClosesAt}
  <SubmitRankings {draftId} {maxRounds} {availableLabs} />
{:else}
  {@const closeDate = format(registrationClosesAt, 'PPP')}
  {@const closeTime = format(registrationClosesAt, 'pp')}
  <Alert.Root variant="warning">
    <TriangleAlert />
    <Alert.Description>
      Registration for the current draft closed on <strong>{closeDate}</strong> at
      <strong>{closeTime}</strong>. You may no longer register.
    </Alert.Description>
  </Alert.Root>
{/if}
