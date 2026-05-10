<script lang="ts">
  import type { LotteryAggregate } from '$lib/features/drafts/types';

  import StatCards from './stat-cards.svelte';

  import LotteryOutcomeChart from './outcome/index.svelte';

  interface Props {
    draftId: string;
    lotteryAggregate: LotteryAggregate;
  }

  const { draftId, lotteryAggregate }: Props = $props();

  const hasLotteryPlacements = $derived(lotteryAggregate.statCards.poolSize > 0);
</script>

<div class="@container space-y-4">
  {#if hasLotteryPlacements}
    <StatCards data={lotteryAggregate.statCards} />
    <LotteryOutcomeChart {draftId} stacks={lotteryAggregate.outcomeStacks} />
  {:else}
    <p class="text-sm text-muted-foreground">
      No lottery was necessary — all pool students were placed manually.
    </p>
  {/if}
</div>
