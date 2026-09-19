<script lang="ts">
  import * as Alert from '$lib/components/ui/alert';
  import type { LotteryAggregate } from '$lib/features/drafts/types';
  import InfoIcon from '@lucide/svelte/icons/info';

  import LotteryOutcomeChart from './outcome/index.svelte';
  import StatCards from './stat-cards.svelte';

  interface Props {
    draftId: string;
    lotteryAggregate: LotteryAggregate;
  }

  const { draftId, lotteryAggregate }: Props = $props();
</script>

<div class="@container space-y-4">
  {#if lotteryAggregate.statCards.poolSize > 0}
    <StatCards data={lotteryAggregate.statCards} />
  {:else}
    <Alert.Root variant="info">
      <InfoIcon />
      <Alert.Title>No Lottery Randomization</Alert.Title>
      <Alert.Description>
        No lottery was necessary because all pool students were placed manually.
      </Alert.Description>
    </Alert.Root>
  {/if}
  <LotteryOutcomeChart {draftId} stacks={lotteryAggregate.outcomeStacks} />
</div>
