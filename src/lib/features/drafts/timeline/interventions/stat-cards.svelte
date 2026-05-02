<script lang="ts">
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import ScaleIcon from '@lucide/svelte/icons/scale';

  import StatCard from '$lib/features/drafts/timeline/stat-card.svelte';
  import { cn } from '$lib/components/ui/utils';
  import type { InterventionsStatCards } from '$lib/features/drafts/types';

  interface Props {
    data: InterventionsStatCards;
    isHistorical: boolean;
  }

  const { data, isHistorical }: Props = $props();

  const deltaWarning = $derived(!isHistorical && data.delta !== 0);
</script>

<div
  class="grid w-fit grid-cols-1 gap-2 sm:grid-cols-[repeat(2,minmax(10rem,14rem))] lg:grid-cols-[repeat(3,minmax(10rem,14rem))]"
>
  <StatCard icon={LayersIcon}>
    {#snippet title()}Pool Size{/snippet}
    {#snippet body()}
      <p id="stat-interventions-pool" class="text-2xl font-bold tabular-nums">{data.poolSize}</p>
    {/snippet}
    {#snippet subtitle()}Students Eligible for Lottery{/snippet}
  </StatCard>
  <StatCard icon={ActivityIcon}>
    {#snippet title()}Lottery Quotas{/snippet}
    {#snippet body()}
      <p id="stat-interventions-quota" class="text-2xl font-bold tabular-nums">
        {data.totalLotteryQuota}
      </p>
    {/snippet}
    {#snippet subtitle()}Total Seats Allocated{/snippet}
  </StatCard>
  {#if !isHistorical}
    <StatCard icon={ScaleIcon}>
      {#snippet title()}Delta{/snippet}
      {#snippet body()}
        <p
          id="stat-interventions-delta"
          class={cn('text-2xl font-bold tabular-nums', { 'text-warning-foreground': deltaWarning })}
        >
          {data.delta > 0 ? '+' : ''}{data.delta}
        </p>
      {/snippet}
      {#snippet subtitle()}
        {deltaWarning ? 'Resolve before running lottery' : 'Ready to run lottery'}
      {/snippet}
    </StatCard>
  {/if}
</div>
