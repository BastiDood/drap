<script lang="ts">
  import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import CogIcon from '@lucide/svelte/icons/cog';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import ScaleIcon from '@lucide/svelte/icons/scale';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import UsersIcon from '@lucide/svelte/icons/users';
  import { format, fromUnixTime, getUnixTime } from 'date-fns';

  import Link from '$lib/components/link.svelte';
  import { getOrdinalSuffix } from '$lib/ordinal';
  import { Progress } from '$lib/components/ui/progress';
  import { resolve } from '$app/paths';

  const { data } = $props();
  const {
    draftId,
    draft: { currRound, maxRounds, activePeriodStart, activePeriodEnd },
    events,
  } = $derived(data);

  interface BaseDraftTimelineEntry {
    key: string;
    createdAt: Date;
  }

  interface DraftEventTimelineEntry extends BaseDraftTimelineEntry {
    type: 'draft-event';
    round: number | null;
    labId: string;
    isSystem: boolean;
  }

  interface DraftConcludedTimelineEntry extends BaseDraftTimelineEntry {
    type: 'draft-concluded';
  }

  interface DraftCreatedTimelineEntry extends BaseDraftTimelineEntry {
    type: 'draft-created';
  }

  type DraftTimelineEntry =
    | DraftEventTimelineEntry
    | DraftConcludedTimelineEntry
    | DraftCreatedTimelineEntry;

  const timelineEntries = $derived.by(() => {
    const seeded: DraftTimelineEntry[] =
      activePeriodEnd === null
        ? []
        : [
            {
              key: `draft-concluded-${activePeriodEnd.toISOString()}`,
              type: 'draft-concluded',
              createdAt: activePeriodEnd,
            },
          ];

    const merged = events.reduce((entries, event, index) => {
      if (
        typeof event === 'object' &&
        event !== null &&
        event.createdAt instanceof Date &&
        typeof event.labId === 'string' &&
        (event.round === null || typeof event.round === 'number') &&
        typeof event.isSystem === 'boolean'
      )
        entries.push({
          key: `${event.createdAt.toISOString()}-${event.labId}-${event.round ?? 'lottery'}-${index}`,
          type: 'draft-event',
          createdAt: event.createdAt,
          round: event.round,
          labId: event.labId,
          isSystem: event.isSystem,
        });
      return entries;
    }, seeded);

    merged.push({
      key: `draft-created-${activePeriodStart.toISOString()}`,
      type: 'draft-created',
      createdAt: activePeriodStart,
    });

    return merged;
  });

  const groupedEntries = $derived(
    Object.entries(
      Object.groupBy(timelineEntries, ({ createdAt }) => `t${getUnixTime(createdAt)}`),
    ).map(([prefixedTimestamp, groupedTimelineEntries]) => {
      if (typeof groupedTimelineEntries === 'undefined')
        throw new Error('Expected grouped timeline entries to exist.');
      return {
        unix: Number(prefixedTimestamp.slice(1)),
        groupedTimelineEntries,
      };
    }),
  );

  const startDateTime = $derived(format(activePeriodStart, 'PPPpp'));
  const startIsoString = $derived(activePeriodStart.toISOString());
  const end = $derived(
    activePeriodEnd === null
      ? null
      : {
          endDateTime: format(activePeriodEnd, 'PPPpp'),
          endIsoString: activePeriodEnd.toISOString(),
        },
  );
</script>

<div class="mb-4 flex items-center gap-2 text-xl">
  <Link href={resolve('/history/')} class="no-underline">Draft History</Link>
  <ChevronRightIcon class="size-4" />
  <span class="font-semibold">Draft #{draftId}</span>
</div>
{#if end !== null}
  {@const { endIsoString, endDateTime } = end}
  <!-- Concluded Draft -->
  <div
    class="preset-tonal-success mb-2 flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm"
  >
    <CheckCircleIcon class="size-6" />
    <p>
      This draft was held from <strong
        ><time datetime={startIsoString}>{startDateTime}</time></strong
      >–<strong><time datetime={endIsoString}>{endDateTime}</time></strong> over {maxRounds} rounds.
    </p>
  </div>
  <Progress value={100} />
{:else if currRound === null}
  <!-- Lottery Stage -->
  <div
    class="preset-tonal-accent mb-2 flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm"
  >
    <SparklesIcon class="size-6" />
    <div>
      This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong
      > and is currently in the lottery stage.
    </div>
  </div>
  <Progress class="animate-pulse" value={100} />
{:else if currRound === 0}
  <!-- Registration Stage -->
  <div
    class="preset-tonal-secondary mb-2 flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm"
  >
    <ClockIcon class="size-6" />
    <div>
      This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong
      > and is currently in the registration stage.
    </div>
  </div>
  <Progress class="border-muted-foreground/40 bg-muted border" value={0} />
{:else}
  <!-- Regular Draft Process -->
  <div
    class="preset-tonal-primary mb-2 flex items-center gap-3 rounded-lg border-2 px-4 py-3 text-sm"
  >
    <ScaleIcon class="size-6" />
    <div>
      This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong
      >
      and is currently in Round {currRound} of {maxRounds} in the regular draft process.
    </div>
  </div>
  <Progress max={maxRounds} value={currRound} />
{/if}
<section class="mt-10 p-4">
  <ol class="border-border relative border-s">
    {#each groupedEntries as { unix, groupedTimelineEntries } (unix)}
      {@const date = fromUnixTime(unix)}
      {@const heading = format(date, 'PPPpp')}
      <li class="ms-6 mb-10">
        <span
          class="bg-background ring-muted-foreground absolute -inset-s-3 mt-0.5 flex size-6 items-center justify-center rounded-full ring-2"
          ><CalendarDaysIcon class="text-foreground size-4" /></span
        >
        <h4 class="mb-2 scroll-m-20 text-xl font-semibold tracking-tight">
          <time datetime={date.toISOString()}>{heading}</time>
        </h4>
        <ol class="space-y-1">
          {#each groupedTimelineEntries as entry (entry.key)}
            {#if entry.type === 'draft-concluded'}
              <li class="preset-tonal-primary rounded-lg border px-3 py-1.5">
                <span class="flex-auto">Draft #{draftId} was concluded.</span>
              </li>
            {:else if entry.type === 'draft-created'}
              <li class="preset-tonal-success rounded-lg border px-3 py-1.5">
                Draft #{draftId} was created.
              </li>
            {:else}
              {@const { isSystem, labId, round } = entry}
              {#if round !== null}
                {@const ordinal = round + getOrdinalSuffix(round)}
                {#if isSystem}
                  <li class="preset-tonal-warning rounded-lg border px-3 py-1.5">
                    <div class="flex items-center gap-3">
                      <CogIcon class="size-4" />
                      <span>
                        The system has skipped the <strong class="uppercase">{labId}</strong> for
                        the {ordinal}
                        round due to insufficient quota and/or zero demand.
                      </span>
                    </div>
                  </li>
                {:else}
                  <li class="preset-tonal-secondary rounded-lg border px-3 py-1.5">
                    <div class="flex items-center gap-3">
                      <UsersIcon class="size-4" />
                      <span>
                        The <strong class="uppercase">{labId}</strong> has selected their {ordinal}
                        batch of draftees.
                      </span>
                    </div>
                  </li>
                {/if}
              {:else if isSystem}
                <li class="preset-tonal-destructive rounded-lg border px-3 py-1.5">
                  <div class="flex items-center gap-3">
                    <TriangleAlertIcon class="size-4" />
                    <span>
                      A system-automated event for the <strong class="uppercase">{labId}</strong>
                      occurred during a lottery. This should be impossible. Kindly
                      <a
                        href="https://github.com/BastiDood/drap/issues/new"
                        class="text-primary underline-offset-4 hover:underline">file an issue</a
                      > and report this bug there.
                    </span>
                  </div>
                </li>
              {:else}
                <li class="preset-tonal-accent rounded-lg border px-3 py-1.5">
                  <div class="flex items-center gap-3">
                    <RefreshCwIcon class="size-4" />
                    <span>
                      The <strong class="uppercase">{labId}</strong> has obtained a batch of draftees
                      from the lottery round.
                    </span>
                  </div>
                </li>
              {/if}
            {/if}
          {/each}
        </ol>
      </li>
    {/each}
  </ol>
</section>
