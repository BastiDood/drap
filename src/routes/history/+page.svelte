<script>
    import { CheckCircle, Clock, Scale } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { format } from 'date-fns';

    // eslint-disable-next-line
    export let data;
    $: ({ drafts } = data);
</script>

<h2 class="h2">Draft History</h2>
{#if drafts.length > 0}
    <nav class="list-nav">
        <ul>
            {#each drafts as { draft_id, active_period_start, active_period_end, curr_round, max_rounds } (draft_id)}
                {@const start = format(active_period_start, 'PPPpp')}
                {#if active_period_end !== null}
                    {@const end = format(active_period_end, 'PPPpp')}
                    <li class="card variant-soft-surface">
                        <a href="/history/{draft_id}/">
                            <Icon src={CheckCircle} class="size-8" />
                            <span class="flex-auto"
                                ><strong>Draft &num;{draft_id}</strong> held {max_rounds} rounds from
                                <time datetime={active_period_start.toISOString()}>{start}</time>
                                &ndash; <time datetime={active_period_end.toISOString()}>{end}</time>.</span
                            >
                        </a>
                    </li>
                {:else if curr_round === null}
                    <li class="card variant-ghost-tertiary">
                        <a href="/history/{draft_id}/">
                            <Icon src={Scale} class="size-8" />
                            <span>&num;{draft_id}</span>
                            <span class="flex-auto"
                                ><strong>Draft &num;{draft_id}</strong> started on
                                <time datetime={active_period_start.toISOString()}>{start}</time> and is now in the
                                lottery stage after {max_rounds} of the regular draft process.</span
                            >
                        </a>
                    </li>
                {:else if curr_round === 0}
                    <li class="card variant-ghost-tertiary">
                        <a href="/history/{draft_id}/">
                            <Icon src={Clock} class="size-8" />
                            <span class="flex-auto"
                                ><strong>Draft &num;{draft_id}</strong> started on
                                <time datetime={active_period_start.toISOString()}>{start}</time> and is currently waiting
                                for students to register.</span
                            >
                        </a>
                    </li>
                {:else}
                    <li class="card variant-soft-secondary">
                        <a href="/history/{draft_id}/">
                            <Icon src={Scale} class="size-8" />
                            <span class="flex-auto"
                                ><strong>Draft &num;{draft_id}</strong> started on
                                <time datetime={active_period_start.toISOString()}>{start}</time>
                                and is currently in Round {curr_round}/{max_rounds} in the regular draft process.</span
                            >
                        </a>
                    </li>
                {/if}
            {/each}
        </ul>
    </nav>
{:else}
    <WarningAlert>No drafts have been recorded yet. Please check again later.</WarningAlert>
{/if}
