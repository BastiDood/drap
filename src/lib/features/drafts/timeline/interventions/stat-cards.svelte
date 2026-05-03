<script lang="ts">
  import ActivityIcon from '@lucide/svelte/icons/activity';
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import ScaleIcon from '@lucide/svelte/icons/scale';

  import * as Card from '$lib/components/ui/card';
  import * as Popover from '$lib/components/ui/popover';
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

<Card.Root class="preset-tonal-muted w-full bg-linear-to-br via-background">
  <Card.Header class="pb-2">
    <Card.Title class="flex items-center gap-1.5">
      Intervetion Stats
      <Popover.Root>
        <Popover.Trigger class="leading-none transition hover:opacity-80">
          <CircleHelpIcon class="size-3.5 text-muted-foreground" />
        </Popover.Trigger>
        <Popover.Content class="max-w-xs space-y-2 text-sm font-normal">
          <ul class="list-disc space-y-1.5 pl-4">
            <li>
              <strong>Pool Size:</strong> Undrafted students after regular rounds
            </li>
            <li>
              <strong>Lottery Quota:</strong> Total seats for lottery
            </li>
            <li>
              <strong>Delta:</strong> Vacancies minus quota. Resolve non-zero before running lottery.
            </li>
          </ul>
        </Popover.Content>
      </Popover.Root>
    </Card.Title>
    <Card.Description>Current status of undrafted students and lottery allocation</Card.Description>
  </Card.Header>
  <Card.Content>
    <div
      class="grid w-fit grid-cols-1 gap-2 sm:grid-cols-[repeat(2,minmax(10rem,14rem))] lg:grid-cols-[repeat(3,minmax(10rem,14rem))]"
    >
      <StatCard icon={LayersIcon}>
        {#snippet title()}Pool Size{/snippet}
        {#snippet body()}
          <p id="stat-interventions-pool" class="text-2xl font-bold tabular-nums">
            {data.poolSize}
          </p>
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
              class={cn('text-2xl font-bold tabular-nums', {
                'text-warning-foreground': deltaWarning,
              })}
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
  </Card.Content>
</Card.Root>
