<script lang="ts">
  import ChartColumnIcon from '@lucide/svelte/icons/chart-column';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import PaperclipIcon from '@lucide/svelte/icons/paperclip';

  import * as Card from '$lib/components/ui/card';
  import * as Drawer from '$lib/components/ui/drawer';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Button } from '$lib/components/ui/button';
  import type { DraftAssignmentSummary, Lab } from '$lib/features/drafts/types';

  import RoundSummaryChart from './round-summary-chart.svelte';
  import StudentsSummary from './students-summary.svelte';

  import SystemLogsLoader from './system-logs/loader.svelte';
  import UndraftedDrawer from './undrafted-drawer/index.svelte';

  interface Props {
    draftId: string;
    requestedAt: Date;
    round: number;
    labs: Lab[];
    assignmentSummary: DraftAssignmentSummary;
    showUndrafted: boolean;
  }

  const { draftId, requestedAt, round, labs, assignmentSummary, showUndrafted }: Props = $props();

  const maxRounds = $derived(Math.max(assignmentSummary.chart.phases.length - 2, 0));
  const displayedRounds = $derived(Math.min(round, maxRounds));

  let group = $state<'summary' | 'students'>('summary');
</script>

<Tabs.Root bind:value={group}>
  <div class="flex justify-around sm:justify-normal">
    <Tabs.List class="grid h-full w-full grid-cols-2">
      <Tabs.Trigger value="summary">
        <ChartColumnIcon class="size-5" />
        <span class="sr-only md:not-sr-only">Lab Distributions</span>
      </Tabs.Trigger>
      <Tabs.Trigger value="students">
        <GraduationCapIcon class="size-5" />
        <span class="sr-only md:not-sr-only">Registered Students</span>
      </Tabs.Trigger>
    </Tabs.List>
  </div>
  <Tabs.Content value="summary">
    {#if group === 'summary'}
      <Card.Root
        class="overflow-hidden border-border/60 bg-linear-to-br from-muted/40 via-background to-muted/10 shadow-xs"
      >
        <Card.Header class="gap-3">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div class="space-y-1">
              <Card.Title>Lab Distributions</Card.Title>
              <Card.Description>
                Assigned students per lab for rounds 1 to {displayedRounds}.
              </Card.Description>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              {#if showUndrafted}
                <UndraftedDrawer {draftId} {round} {labs} />
              {/if}
              <Drawer.Root direction="bottom">
                <Drawer.Trigger>
                  {#snippet child({ props })}
                    <Button variant="outline" size="sm" {...props}>
                      <PaperclipIcon class="size-4" />
                      <span>View System Logs</span>
                    </Button>
                  {/snippet}
                </Drawer.Trigger>
                <Drawer.Content
                  class="flex min-h-dvh flex-col gap-4 overflow-hidden p-4 md:min-h-[50vh]"
                >
                  <Drawer.Header class="shrink-0 p-0">
                    <Drawer.Title>System Logs</Drawer.Title>
                    <Drawer.Description>
                      Review faculty picks and automation events by round.
                    </Drawer.Description>
                  </Drawer.Header>
                  <div class="min-h-0 grow overflow-auto">
                    <SystemLogsLoader {draftId} {requestedAt} />
                  </div>
                </Drawer.Content>
              </Drawer.Root>
            </div>
          </div>
        </Card.Header>
        <Card.Content class="pt-0">
          <RoundSummaryChart chart={assignmentSummary.chart} {displayedRounds} />
        </Card.Content>
      </Card.Root>
    {/if}
  </Tabs.Content>
  <Tabs.Content value="students">
    {#if group === 'students'}
      <StudentsSummary {draftId} />
    {/if}
  </Tabs.Content>
</Tabs.Root>
