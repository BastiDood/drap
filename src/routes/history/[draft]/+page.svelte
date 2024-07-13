<script>
    import { Clock, Scale, Sparkles } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { ProgressBar } from '@skeletonlabs/skeleton';
    import Success from '$lib/alerts/Success.svelte';
    import { format } from 'date-fns';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        id,
        draft: { curr_round, max_rounds, active_period_start, active_period_end },
    } = data);
    $: start = format(active_period_start, 'PPPpp');
</script>

<h2 class="h2">Draft &num;{id}</h2>
{#if active_period_end !== null}
    {@const end = format(active_period_end, 'PPPpp')}
    <!-- Concluded Draft -->
    <Success>
        This draft was held from <strong><time datetime={active_period_start.toISOString()}>{start}</time></strong>
        &ndash; <strong><time datetime={active_period_end.toISOString()}>{end}</time></strong> over {max_rounds} rounds.
    </Success>
{:else if curr_round === null}
    <!-- Lottery Stage -->
    <ProgressBar meter="bg-primary-500-400-token" />
    <div class="alert variant-ghost-secondary">
        <Icon src={Sparkles} class="size-8" />
        <div class="alert-message">
            This draft started last <strong><time datetime={active_period_start.toISOString()}>{start}</time></strong> and
            is currently in the lottery stage.
        </div>
    </div>
{:else if curr_round === 0}
    <!-- Registration Stage -->
    <div class="alert variant-ghost-tertiary">
        <Icon src={Clock} class="size-8" />
        <div class="alert-message">
            This draft started last <strong><time datetime={active_period_start.toISOString()}>{start}</time></strong> and
            is currently in the registration stage.
        </div>
    </div>
{:else}
    <!-- Regular Draft Process -->
    <ProgressBar max={max_rounds} value={curr_round} meter="bg-primary-500-400-token" />
    <div class="alert variant-soft-secondary">
        <Icon src={Scale} class="size-8" />
        <div class="alert-message">
            This draft started last <strong><time datetime={active_period_start.toISOString()}>{start}</time></strong>
            and is currently in Round {curr_round} of {max_rounds} in the regular draft process.
        </div>
    </div>
{/if}
