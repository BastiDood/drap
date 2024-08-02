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
    import { ProgressBar } from '@skeletonlabs/skeleton';
    import Success from '$lib/alerts/Success.svelte';
    import { getOrdinalSuffix } from '$lib/ordinal';
    import { groupby } from 'itertools';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        did,
        draft: { curr_round, max_rounds, active_period_start, active_period_end },
        events,
    } = data);

    // TODO: How do we merge the creation and conclusion events into the same array?
    $: entries = Array.from(
        groupby(events, ({ created_at }) => getUnixTime(created_at)),
        ([timestamp, events]) => [timestamp, Array.from(events)] as const,
    );

    $: startDateTime = format(active_period_start, 'PPPpp');
    $: startIsoString = active_period_start.toISOString();
    $: end =
        active_period_end === null
            ? null
            : { endDateTime: format(active_period_end, 'PPPpp'), endIsoString: active_period_end.toISOString() };
</script>

<h2 class="h2">Draft &num;{did}</h2>
{#if end !== null}
    {@const { endIsoString, endDateTime } = end}
    <!-- Concluded Draft -->
    <Success>
        This draft was held from <strong><time datetime={startIsoString}>{startDateTime}</time></strong>
        &ndash; <strong><time datetime={endIsoString}>{endDateTime}</time></strong> over {max_rounds} rounds.
    </Success>
{:else if curr_round === null}
    <!-- Lottery Stage -->
    <ProgressBar meter="bg-primary-600-300-token" />
    <div class="alert variant-ghost-secondary">
        <Icon src={Sparkles} class="size-8" />
        <div class="alert-message">
            This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong> and is currently
            in the lottery stage.
        </div>
    </div>
{:else if curr_round === 0}
    <!-- Registration Stage -->
    <div class="alert variant-ghost-tertiary">
        <Icon src={Clock} class="size-8" />
        <div class="alert-message">
            This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong> and is currently
            in the registration stage.
        </div>
    </div>
{:else}
    <!-- Regular Draft Process -->
    <ProgressBar max={max_rounds} value={curr_round} meter="bg-primary-600-300-token" />
    <div class="alert variant-soft-secondary">
        <Icon src={Scale} class="size-8" />
        <div class="alert-message">
            This draft started last <strong><time datetime={startIsoString}>{startDateTime}</time></strong>
            and is currently in Round {curr_round} of {max_rounds} in the regular draft process.
        </div>
    </div>
{/if}
<section class="p-4">
    <ol class="border-surface-500-400-token relative border-s">
        {#if end !== null}
            {@const { endIsoString, endDateTime } = end}
            <li class="mb-10 ms-6">
                <span
                    class="bg-primary-300-600-token ring-primary-900-50-token absolute -start-3 flex size-6 items-center justify-center rounded-full ring-2"
                    ><Icon src={CalendarDays} class="size-4" theme="micro" /></span
                >
                <h4 class="h4 mb-2"><time datetime={endIsoString}>{endDateTime}</time></h4>
                <ol class="list">
                    <li class="card variant-ghost-success px-3 py-1.5">
                        <span class="flex-auto">Draft &num;{did} was concluded.</span>
                    </li>
                </ol>
            </li>
        {/if}
        {#each entries as [unix, events] (unix)}
            {@const date = fromUnixTime(unix)}
            {@const heading = format(date, 'PPPpp')}
            <li class="mb-10 ms-6">
                <span
                    class="bg-primary-300-600-token ring-primary-900-50-token absolute -start-3 flex size-6 items-center justify-center rounded-full ring-2"
                    ><Icon src={CalendarDays} class="size-4" theme="micro" /></span
                >
                <h4 class="h4 mb-2"><time datetime={date.toISOString()}>{heading}</time></h4>
                <ol class="list">
                    {#each events as { is_system, lab_id, round }}
                        {#if round !== null}
                            {@const ordinal = round + getOrdinalSuffix(round)}
                            {#if is_system}
                                <li class="card variant-soft-surface px-3 py-1.5">
                                    <Icon src={Cog} class="size-4" theme="micro" />
                                    <span class="flex-auto"
                                        >The system has skipped the <strong class="uppercase">{lab_id}</strong> for the {ordinal}
                                        round due to insufficient quota and/or zero demand.</span
                                    >
                                </li>
                            {:else}
                                <li class="card variant-ghost-secondary px-3 py-1.5">
                                    <Icon src={UserGroup} class="size-4" theme="micro" />
                                    <span class="flex-auto"
                                        >The <strong class="uppercase">{lab_id}</strong> has selected their {ordinal} batch
                                        of draftees.</span
                                    >
                                </li>
                            {/if}
                        {:else if is_system}
                            <li class="card variant-ghost-error px-3 py-1.5">
                                <Icon src={ExclamationTriangle} class="size-4" theme="micro" />
                                <span class="flex-auto"
                                    >A system-automated event for the <strong class="uppercase">{lab_id}</strong>
                                    occurred during a lottery. This should be impossible. Kindly
                                    <a href="https://github.com/BastiDood/drap/issues/new" class="anchor"
                                        >file an issue</a
                                    > and report this bug there.</span
                                >
                            </li>
                        {:else}
                            <li class="card variant-ghost-tertiary px-3 py-1.5">
                                <Icon src={ArrowPath} class="size-4" theme="micro" />
                                <span class="flex-auto"
                                    >The <strong class="uppercase">{lab_id}</strong> has obtained a batch of draftees from
                                    the lottery round.</span
                                >
                            </li>
                        {/if}
                    {/each}
                </ol>
            </li>
        {/each}
        <li class="mb-10 ms-6">
            <span
                class="bg-primary-300-600-token ring-primary-900-50-token absolute -start-3 flex size-6 items-center justify-center rounded-full ring-2"
                ><Icon src={CalendarDays} class="size-4" theme="micro" /></span
            >
            <h4 class="h4 mb-2"><time datetime={startIsoString}>{startDateTime}</time></h4>
            <ol class="list">
                <li class="card variant-ghost-success px-3 py-1.5">
                    <span class="flex-auto">Draft &num;{did} was created.</span>
                </li>
            </ol>
        </li>
    </ol>
</section>
