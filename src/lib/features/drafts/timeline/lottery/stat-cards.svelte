<script lang="ts">
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import StarIcon from '@lucide/svelte/icons/star';
  import ThumbsDownIcon from '@lucide/svelte/icons/thumbs-down';
  import ThumbsUpIcon from '@lucide/svelte/icons/thumbs-up';

  import StatCard from '$lib/features/drafts/timeline/stat-card.svelte';
  import StatCardGroup from '$lib/features/drafts/timeline/stat-card-group.svelte';
  import type { LotteryStatCards } from '$lib/features/drafts/types';

  interface Props {
    data: LotteryStatCards;
  }

  const { data }: Props = $props();

  const medianLabel = $derived(
    data.medianRankHonored === null ? '—' : `#${data.medianRankHonored}`,
  );
</script>

<StatCardGroup columns="five">
  <StatCard icon={LayersIcon}>
    {#snippet title()}Pool Size{/snippet}
    {#snippet body()}
      <p id="stat-lottery-pool" class="text-2xl font-bold tabular-nums">{data.poolSize}</p>
    {/snippet}
    {#snippet subtitle()}Lottery-Placed Students{/snippet}
  </StatCard>

  <StatCard icon={StarIcon}>
    {#snippet title()}Top-Choice Placements{/snippet}
    {#snippet body()}
      <p id="stat-lottery-top" class="text-2xl font-bold tabular-nums">{data.topChoice}</p>
    {/snippet}
    {#snippet subtitle()}Placed in 1st-Ranked Lab{/snippet}
  </StatCard>

  <StatCard icon={ThumbsUpIcon}>
    {#snippet title()}Ranked-Lab Placements{/snippet}
    {#snippet body()}
      <p id="stat-lottery-ranked" class="text-2xl font-bold tabular-nums">{data.rankedLab}</p>
    {/snippet}
    {#snippet subtitle()}Placed in a Lab They Ranked{/snippet}
  </StatCard>

  <StatCard icon={ThumbsDownIcon}>
    {#snippet title()}Unranked Placements{/snippet}
    {#snippet body()}
      <p id="stat-lottery-unranked" class="text-2xl font-bold tabular-nums">{data.unranked}</p>
    {/snippet}
    {#snippet subtitle()}Placed in an Unranked Lab{/snippet}
  </StatCard>

  <StatCard icon={ActivityIcon}>
    {#snippet title()}Median Rank Honored{/snippet}
    {#snippet body()}
      <p id="stat-lottery-median" class="text-2xl font-bold tabular-nums">{medianLabel}</p>
    {/snippet}
    {#snippet subtitle()}Among Ranked Placements{/snippet}
  </StatCard>
</StatCardGroup>
