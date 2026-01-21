<script lang="ts">
  import CalendarDays from '@lucide/svelte/icons/calendar-days';
  import CheckCircle from '@lucide/svelte/icons/check-circle';
  import Clock from '@lucide/svelte/icons/clock';
  import Cog from '@lucide/svelte/icons/cog';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import Scale from '@lucide/svelte/icons/scale';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Users from '@lucide/svelte/icons/users';
  import { format, fromUnixTime, getUnixTime } from 'date-fns';
  import { groupby } from 'itertools';

  import * as Alert from '$lib/components/ui/alert';
  import { getOrdinalSuffix } from '$lib/ordinal';
  import { Progress } from '$lib/components/ui/progress';

  const { data } = $props();
  const {
    did,
    draft: { currRound, maxRounds, activePeriodStart, activePeriodEnd },
    events,
  } = $derived(data);

  // TODO: How do we merge the creation and conclusion events into the same array?
  const entries = $derived(
    Array.from(
      groupby(events, ({ createdAt }) => getUnixTime(createdAt)),
      ([timestamp, events]) => [timestamp, Array.from(events)] as const,
    ),
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

<h2 class="scroll-m-20 text-3xl font-semibold tracking-tight">Draft #{did}</h2>
{#if end !== null}
  {@const { endIsoString, endDateTime } = end}
  <!-- Concluded Draft -->
  <Alert.Root variant="success">
    <CheckCircle />
    <Alert.Description>
      This draft was held from <strong
        ><time datetime={startIsoString}>{startDateTime}</time></strong
      >
      – <strong><time datetime={endIsoString}>{endDateTime}</time></strong> over {maxRounds} rounds.
    </Alert.Description>
  </Alert.Root>
{:else if currRound === null}
  <!-- Lottery Stage -->
  <Progress value={100} />
  <div class="border-secondary bg-secondary/10 flex items-center gap-3 rounded-lg border px-2 py-1">
    <Sparkles class="size-8" />
    <div>
      This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong
      > and is currently in the lottery stage.
    </div>
  </div>
{:else if currRound === 0}
  <!-- Registration Stage -->
  <div class="border-accent bg-accent/10 flex items-center gap-3 rounded-lg border px-2 py-1">
    <Clock class="size-8" />
    <div>
      This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong
      > and is currently in the registration stage.
    </div>
  </div>
{:else}
  <!-- Regular Draft Process -->
  <Progress max={maxRounds} value={currRound} />
  <div class="bg-secondary/10 flex items-center gap-3 rounded-lg px-2 py-1">
    <Scale class="size-8" />
    <div>
      This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong
      >
      and is currently in Round {currRound} of {maxRounds} in the regular draft process.
    </div>
  </div>
{/if}
<section class="p-4">
  <ol class="border-border relative border-s">
    {#if end !== null}
      {@const { endIsoString, endDateTime } = end}
      <li class="ms-6 mb-10">
        <span
          class="bg-primary ring-background absolute -start-3 flex size-6 items-center justify-center rounded-full ring-2"
          ><CalendarDays class="text-primary-foreground size-4" /></span
        >
        <h4 class="mb-2 scroll-m-20 text-xl font-semibold tracking-tight">
          <time datetime={endIsoString}>{endDateTime}</time>
        </h4>
        <ol class="space-y-1">
          <li class="border-success bg-success/10 rounded-lg border px-3 py-1.5">
            <span class="flex-auto">Draft #{did} was concluded.</span>
          </li>
        </ol>
      </li>
    {/if}
    {#each entries as [unix, events] (unix)}
      {@const date = fromUnixTime(unix)}
      {@const heading = format(date, 'PPPpp')}
      <li class="ms-6 mb-10">
        <span
          class="bg-primary ring-background absolute -start-3 flex size-6 items-center justify-center rounded-full ring-2"
          ><CalendarDays class="text-primary-foreground size-4" /></span
        >
        <h4 class="mb-2 scroll-m-20 text-xl font-semibold tracking-tight">
          <time datetime={date.toISOString()}>{heading}</time>
        </h4>
        <ol class="space-y-1">
          {#each events as { isSystem, labId, round }, index (index)}
            {#if round !== null}
              {@const ordinal = round + getOrdinalSuffix(round)}
              {#if isSystem}
                <li class="border-warning bg-warning/10 rounded-lg border px-3 py-1.5">
                  <div class="flex items-center gap-3">
                    <Cog class="size-4" />
                    <span>
                      The system has skipped the <strong class="uppercase">{labId}</strong> for the {ordinal}
                      round due to insufficient quota and/or zero demand.
                    </span>
                  </div>
                </li>
              {:else}
                <li class="border-secondary bg-secondary/10 rounded-lg border px-3 py-1.5">
                  <div class="flex items-center gap-3">
                    <Users class="size-4" />
                    <span>
                      The <strong class="uppercase">{labId}</strong> has selected their {ordinal} batch
                      of draftees.
                    </span>
                  </div>
                </li>
              {/if}
            {:else if isSystem}
              <li class="border-destructive bg-destructive/10 rounded-lg border px-3 py-1.5">
                <div class="flex items-center gap-3">
                  <TriangleAlert class="size-4" />
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
              <li class="border-accent bg-accent/10 rounded-lg border px-3 py-1.5">
                <div class="flex items-center gap-3">
                  <RefreshCw class="size-4" />
                  <span>
                    The <strong class="uppercase">{labId}</strong> has obtained a batch of draftees from
                    the lottery round.
                  </span>
                </div>
              </li>
            {/if}
          {/each}
        </ol>
      </li>
    {/each}
    <li class="ms-6 mb-10">
      <span
        class="bg-primary ring-background absolute -start-3 flex size-6 items-center justify-center rounded-full ring-2"
        ><CalendarDays class="text-primary-foreground size-4" /></span
      >
      <h4 class="mb-2 scroll-m-20 text-xl font-semibold tracking-tight">
        <time datetime={startIsoString}>{startDateTime}</time>
      </h4>
      <ol class="space-y-1">
        <li class="border-success bg-success/10 rounded-lg border px-3 py-1.5">
          Draft #{did} was created.
        </li>
      </ol>
    </li>
  </ol>
</section>
