<script lang="ts">
  import type { LotteryAggregate } from '$lib/features/drafts/types';

  import FinalizeForm from './finalize-form.svelte';
  import LotteryOutcomeChart from './lottery-outcome-chart.svelte';
  import StatCards from './stat-cards.svelte';

  interface Props {
    draftId: string;
    isReview: boolean;
    lotteryAggregate: LotteryAggregate;
  }

  const { draftId, isReview, lotteryAggregate }: Props = $props();

  const hasLotteryPlacements = $derived(lotteryAggregate.statCards.poolSize > 0);
</script>

<div class="@container space-y-4">
  {#if hasLotteryPlacements}
    <StatCards data={lotteryAggregate.statCards} />
    <LotteryOutcomeChart stacks={lotteryAggregate.outcomeStacks} />
  {:else}
    <p class="text-sm text-muted-foreground">
      No lottery was necessary — all pool students were placed manually.
    </p>
  {/if}
  {#if isReview}
    <FinalizeForm {draftId} />
  {/if}
</div>
