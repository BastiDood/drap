<script lang="ts">
  import {
    ArrowPath,
    CalendarDays,
    Clock,
    Cog,
    ExclamationTriangle,
    Scale,
    Sparkles,
    UserGroup,
  } from '@steeze-ui/heroicons';
  import { format, fromUnixTime, getUnixTime } from 'date-fns';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { Progress } from '@skeletonlabs/skeleton-svelte';
  import Success from '$lib/alerts/Success.svelte';
  import { getOrdinalSuffix } from '$lib/ordinal';
  import { groupby } from 'itertools';

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

<h2 class="h2">Draft #{did}</h2>
{#if end !== null}
  {@const { endIsoString, endDateTime } = end}
  <!-- Concluded Draft -->
  <Success>
    This draft was held from <strong><time datetime={startIsoString}>{startDateTime}</time></strong>
    – <strong><time datetime={endIsoString}>{endDateTime}</time></strong> over {maxRounds} rounds.
  </Success>
{:else if currRound === null}
  <!-- Lottery Stage -->
  <Progress meterBg="bg-primary-700-300" />
  <div
    class="preset-tonal-secondary border-secondary-500 flex items-center gap-3 rounded-lg border px-2 py-1"
  >
    <Icon src={Sparkles} class="size-8" />
    <div>
      This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong
      > and is currently in the lottery stage.
    </div>
  </div>
{:else if currRound === 0}
  <!-- Registration Stage -->
  <div
    class="preset-tonal-tertiary border-tertiary-500 flex items-center gap-3 rounded-lg border px-2 py-1"
  >
    <Icon src={Clock} class="size-8" />
    <div>
      This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong
      > and is currently in the registration stage.
    </div>
  </div>
{:else}
  <!-- Regular Draft Process -->
  <Progress max={maxRounds} value={currRound} meterBg="bg-primary-700-300" />
  <div class="preset-tonal-secondary flex items-center gap-3 rounded-lg px-2 py-1">
    <Icon src={Scale} class="size-8" />
    <div>
      This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong
      >
      and is currently in Round {currRound} of {maxRounds} in the regular draft process.
    </div>
  </div>
{/if}
<section class="p-4">
  <ol class="border-surface-600-400 relative border-s">
    {#if end !== null}
      {@const { endIsoString, endDateTime } = end}
      <li class="ms-6 mb-10">
        <span
          class="bg-primary-300-700 ring-primary-950-50 absolute -start-3 flex size-6 items-center justify-center rounded-full ring-2"
          ><Icon src={CalendarDays} class="size-4" theme="micro" /></span
        >
        <h4 class="h4 mb-2"><time datetime={endIsoString}>{endDateTime}</time></h4>
        <ol class="list">
          <li class="card preset-tonal-success border-success-500 border px-3 py-1.5">
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
          class="bg-primary-300-700 ring-primary-950-50 absolute -start-3 flex size-6 items-center justify-center rounded-full ring-2"
          ><Icon src={CalendarDays} class="size-4" theme="micro" /></span
        >
        <h4 class="h4 mb-2"><time datetime={date.toISOString()}>{heading}</time></h4>
        <ol class="list">
          {#each events as { isSystem, labId, round }, index (index)}
            {#if round !== null}
              {@const ordinal = round + getOrdinalSuffix(round)}
              {#if isSystem}
                <li class="card preset-tonal-surface px-3 py-1.5">
                  <Icon src={Cog} class="size-4" theme="micro" />
                  <span class="flex-auto"
                    >The system has skipped the <strong class="uppercase">{labId}</strong> for the {ordinal}
                    round due to insufficient quota and/or zero demand.</span
                  >
                </li>
              {:else}
                <li class="card preset-tonal-secondary border-secondary-500 border px-3 py-1.5">
                  <Icon src={UserGroup} class="size-4" theme="micro" />
                  <span class="flex-auto"
                    >The <strong class="uppercase">{labId}</strong> has selected their {ordinal} batch
                    of draftees.</span
                  >
                </li>
              {/if}
            {:else if isSystem}
              <li class="card preset-tonal-error border-error-500 border px-3 py-1.5">
                <Icon src={ExclamationTriangle} class="size-4" theme="micro" />
                <span class="flex-auto"
                  >A system-automated event for the <strong class="uppercase">{labId}</strong>
                  occurred during a lottery. This should be impossible. Kindly
                  <a href="https://github.com/BastiDood/drap/issues/new" class="anchor"
                    >file an issue</a
                  > and report this bug there.</span
                >
              </li>
            {:else}
              <li class="card preset-tonal-tertiary border-tertiary-500 border px-3 py-1.5">
                <Icon src={ArrowPath} class="size-4" theme="micro" />
                <span class="flex-auto"
                  >The <strong class="uppercase">{labId}</strong> has obtained a batch of draftees from
                  the lottery round.</span
                >
              </li>
            {/if}
          {/each}
        </ol>
      </li>
    {/each}
    <li class="ms-6 mb-10">
      <span
        class="bg-primary-300-700 ring-primary-950-50 absolute -start-3 flex size-6 items-center justify-center rounded-full ring-2"
        ><Icon src={CalendarDays} class="size-4" theme="micro" /></span
      >
      <h4 class="h4 mb-2"><time datetime={startIsoString}>{startDateTime}</time></h4>
      <ol class="list">
        <li class="card preset-tonal-success border-success-500 border px-3 py-1.5">
          <span class="flex-auto">Draft #{did} was created.</span>
        </li>
      </ol>
    </li>
  </ol>
</section>
