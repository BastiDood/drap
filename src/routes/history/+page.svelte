<script lang="ts">
  import { CheckCircle, Clock, Scale, Sparkles } from '@steeze-ui/heroicons';
  import { Icon } from '@steeze-ui/svelte-icon';
  import WarningAlert from '$lib/alerts/Warning.svelte';
  import { format } from 'date-fns';

  const { data } = $props();
  const { drafts } = $derived(data);
</script>

<h2 class="h2">Draft History</h2>
{#if drafts.length > 0}
  <nav class="list-nav">
    <ul>
      {#each drafts as { id: draftId, activePeriodStart, activePeriodEnd, currRound, maxRounds } (draftId)}
        {@const start = format(activePeriodStart, 'PPPpp')}
        {#if activePeriodEnd !== null}
          <!-- Concluded Draft -->
          {@const end = format(activePeriodEnd, 'PPPpp')}
          <li class="card variant-soft-surface">
            <a href="/history/{draftId}/">
              <Icon src={CheckCircle} class="size-8" />
              <span class="flex-auto"
                ><strong>Draft &num;{draftId}</strong> was held from
                <time datetime={activePeriodStart.toISOString()}>{start}</time> &ndash;
                <time datetime={activePeriodEnd.toISOString()}>{end}</time> over {maxRounds} rounds.</span
              >
            </a>
          </li>
        {:else if currRound === null}
          <!-- Lottery Stage -->
          <li class="card variant-ghost-secondary">
            <a href="/history/{draftId}/">
              <Icon src={Sparkles} class="size-8" />
              <span class="flex-auto"
                ><strong>Draft &num;{draftId}</strong> started on
                <time datetime={activePeriodStart.toISOString()}>{start}</time> and is now in the
                lottery stage after {maxRounds} of the regular draft process.</span
              >
            </a>
          </li>
        {:else if currRound === 0}
          <!-- Registration Stage -->
          <li class="card variant-ghost-tertiary">
            <a href="/history/{draftId}/">
              <Icon src={Clock} class="size-8" />
              <span class="flex-auto"
                ><strong>Draft &num;{draftId}</strong> started on
                <time datetime={activePeriodStart.toISOString()}>{start}</time> and is currently waiting
                for students to register.</span
              >
            </a>
          </li>
        {:else}
          <!-- Regular Draft Process -->
          <li class="card variant-soft-secondary">
            <a href="/history/{draftId}/">
              <Icon src={Scale} class="size-8" />
              <span class="flex-auto"
                ><strong>Draft &num;{draftId}</strong> started on
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
  <WarningAlert>No drafts have been recorded yet. Please check again later.</WarningAlert>
{/if}
