<script lang="ts">
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import ScaleIcon from '@lucide/svelte/icons/scale';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import { format } from 'date-fns';

  import Callout from '$lib/components/callout.svelte';
  import { resolve } from '$app/paths';

  const { data } = $props();
  const { drafts } = $derived(data);
</script>

<h2 class="mb-8 scroll-m-20 text-3xl font-semibold tracking-tight">Draft History</h2>
{#if drafts.length > 0}
  <nav>
    <ul class="space-y-2">
      {#each drafts as { id: draftId, activePeriodStart, activePeriodEnd, currRound, maxRounds } (draftId)}
        {@const start = format(activePeriodStart, 'PPPpp')}
        {#if activePeriodEnd !== null}
          <!-- Concluded Draft -->
          {@const end = format(activePeriodEnd, 'PPPpp')}
          <li
            class="preset-tonal-muted rounded-lg border-3 px-2 py-3 transition duration-150 hover:brightness-120 dark:hover:brightness-110"
          >
            <a href={resolve(`/history/${draftId}/`)} class="flex items-center gap-3 px-2 py-1">
              <CheckCircleIcon class="size-8" />
              <span
                ><strong>Draft #{draftId}</strong> was held from
                <time datetime={activePeriodStart.toISOString()}>{start}</time> –
                <time datetime={activePeriodEnd.toISOString()}>{end}</time> over {maxRounds} rounds.</span
              >
            </a>
          </li>
        {:else if currRound === null}
          <!-- Lottery Stage -->
          <li
            class="preset-tonal-accent rounded-lg border-3 px-2 py-3 transition duration-150 hover:brightness-115 dark:hover:brightness-110"
          >
            <a href={resolve(`/history/${draftId}/`)} class="flex items-center gap-3 px-2 py-1">
              <SparklesIcon class="size-8" />
              <span
                ><strong>Draft #{draftId}</strong> started on
                <time datetime={activePeriodStart.toISOString()}>{start}</time> and is now in the
                lottery stage after {maxRounds} of the regular draft process.</span
              >
            </a>
          </li>
        {:else if currRound === 0}
          <!-- Registration Stage -->
          <li
            class="preset-tonal-secondary rounded-lg border-3 px-2 py-3 transition duration-150 hover:brightness-115 dark:hover:brightness-110"
          >
            <a href={resolve(`/history/${draftId}/`)} class="flex items-center gap-3 px-2 py-1">
              <ClockIcon class="size-8" />
              <span
                ><strong>Draft #{draftId}</strong> started on
                <time datetime={activePeriodStart.toISOString()}>{start}</time> and is currently waiting
                for students to register.</span
              >
            </a>
          </li>
        {:else}
          <!-- Regular Draft Process -->
          <li
            class="preset-tonal-primary rounded-lg border-3 px-2 py-3 transition duration-150 hover:brightness-120 dark:hover:brightness-110"
          >
            <a href={resolve(`/history/${draftId}/`)} class="flex items-center gap-3 px-2 py-1">
              <ScaleIcon class="size-8" />
              <span
                ><strong>Draft #{draftId}</strong> started on
                <time datetime={activePeriodStart.toISOString()}>{start}</time>
                and is currently in Round {currRound}/{maxRounds} in the regular draft process.</span
              >
            </a>
          </li>
        {/if}
      {/each}
    </ul>
  </nav>
{:else}
  <Callout variant="warning">No drafts have been recorded yet. Please check again later.</Callout>
{/if}
