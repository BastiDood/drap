<script lang="ts">
  import CheckCircle from '@lucide/svelte/icons/check-circle';
  import Clock from '@lucide/svelte/icons/clock';
  import Scale from '@lucide/svelte/icons/scale';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { format } from 'date-fns';

  import * as Alert from '$lib/components/ui/alert';
  import { resolve } from '$app/paths';

  const { data } = $props();
  const { drafts } = $derived(data);
</script>

<h2 class="scroll-m-20 text-3xl font-semibold tracking-tight">Draft History</h2>
{#if drafts.length > 0}
  <nav class="space-y-1">
    <ul>
      {#each drafts as { id: draftId, activePeriodStart, activePeriodEnd, currRound, maxRounds } (draftId)}
        {@const start = format(activePeriodStart, 'PPPpp')}
        {#if activePeriodEnd !== null}
          <!-- Concluded Draft -->
          {@const end = format(activePeriodEnd, 'PPPpp')}
          <li class="bg-muted rounded-lg">
            <a href={resolve(`/history/${draftId}/`)} class="flex items-center gap-3 px-2 py-1">
              <CheckCircle class="size-8" />
              <span
                ><strong>Draft #{draftId}</strong> was held from
                <time datetime={activePeriodStart.toISOString()}>{start}</time> –
                <time datetime={activePeriodEnd.toISOString()}>{end}</time> over {maxRounds} rounds.</span
              >
            </a>
          </li>
        {:else if currRound === null}
          <!-- Lottery Stage -->
          <li class="border-secondary bg-secondary/10 rounded-lg border">
            <a href={resolve(`/history/${draftId}/`)} class="flex items-center gap-3 px-2 py-1">
              <Sparkles class="size-8" />
              <span
                ><strong>Draft #{draftId}</strong> started on
                <time datetime={activePeriodStart.toISOString()}>{start}</time> and is now in the
                lottery stage after {maxRounds} of the regular draft process.</span
              >
            </a>
          </li>
        {:else if currRound === 0}
          <!-- Registration Stage -->
          <li class="border-accent bg-accent/10 rounded-lg border">
            <a href={resolve(`/history/${draftId}/`)} class="flex items-center gap-3 px-2 py-1">
              <Clock class="size-8" />
              <span
                ><strong>Draft #{draftId}</strong> started on
                <time datetime={activePeriodStart.toISOString()}>{start}</time> and is currently waiting
                for students to register.</span
              >
            </a>
          </li>
        {:else}
          <!-- Regular Draft Process -->
          <li class="bg-secondary/10 rounded-lg">
            <a href={resolve(`/history/${draftId}/`)} class="flex items-center gap-3 px-2 py-1">
              <Scale class="size-8" />
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
  <Alert.Root variant="warning">
    <TriangleAlert />
    <Alert.Description
      >No drafts have been recorded yet. Please check again later.</Alert.Description
    >
  </Alert.Root>
{/if}
