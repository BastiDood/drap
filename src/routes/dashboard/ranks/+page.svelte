<script lang="ts">
    import { ArrowDown, ArrowUp, XMark } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { assert } from '$lib/assert';
    import { format } from 'date-fns';
    import { slide } from 'svelte/transition';

    import ErrorAlert from '$lib/alerts/Error.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ availableLabs, draft } = data);

    let selectedLabs = [] as typeof availableLabs;

    function selectLab(index: number) {
        assert(draft !== null);
        if (selectedLabs.length >= draft.max_rounds) return;
        selectedLabs.push(...availableLabs.splice(index, 1));
        availableLabs = availableLabs;
        selectedLabs = selectedLabs;
    }

    function moveLabUp(above: number) {
        const below = above--;
        if (above < 0) return;

        const temp = selectedLabs[below];
        assert(typeof temp !== 'undefined');
        const target = selectedLabs[above];
        assert(typeof target !== 'undefined');

        selectedLabs[below] = target;
        selectedLabs[above] = temp;
    }

    function moveLabDown(below: number) {
        const above = below++;
        if (below >= selectedLabs.length) return;

        const temp = selectedLabs[below];
        assert(typeof temp !== 'undefined');
        const target = selectedLabs[above];
        assert(typeof target !== 'undefined');

        selectedLabs[below] = target;
        selectedLabs[above] = temp;
    }

    function resetSelection(index: number) {
        availableLabs.push(...selectedLabs.splice(index, 1));
        availableLabs = availableLabs;
        selectedLabs = selectedLabs;
    }
</script>

{#if draft === null}
    <ErrorAlert>There is no active draft at the moment. Please check again later.</ErrorAlert>
{:else}
    {@const { draft_id, curr_round, max_rounds, active_period_start } = draft}
    {@const start = format(active_period_start, 'PPPpp')}
    {@const remaining = max_rounds - selectedLabs.length}
    {@const hasRemaining = remaining > 0}
    {@const cardVariant = hasRemaining ? 'variant-ghost-primary' : 'variant-ghost-secondary'}
    {@const cardCursor = hasRemaining ? 'cursor-pointer' : 'cursor-not-allowed'}
    {@const cardOpacity = hasRemaining ? 'opacity-100' : 'opacity-50'}
    <h1 class="h1 mb-8">Draft &num;{draft_id}</h1>
    <div class="card {cardVariant} prose max-w-none p-4 transition dark:prose-invert">
        <p>
            This draft is currently on Round <strong>{curr_round}</strong> of <strong>{max_rounds}</strong>. The zeroth
            round started last <strong>{start}</strong>.
        </p>
        <p>Lab preferences are ordered by preference from top (most preferred) to bottom (least preferred).</p>
        <p>
            {#if hasRemaining}
                You may select up to <strong>{remaining}</strong> labs left.
            {:else}
                You may no longer select any more labs.
            {/if}
        </p>
    </div>
    <hr class="!border-surface-400-500-token !border-t-4" />
    <div class="space-y-2">
        {#each selectedLabs as { lab_id, lab_name }, idx (lab_id)}
            <div
                class="card grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 p-4"
                transition:slide={{ duration: 120 }}
            >
                <span>{lab_name}</span>
                <button
                    type="button"
                    class="variant-filled-success btn-icon btn-icon-sm"
                    on:click={moveLabUp.bind(null, idx)}
                >
                    <Icon src={ArrowUp} class="size-6" />
                </button>
                <button
                    type="button"
                    class="variant-filled-warning btn-icon btn-icon-sm"
                    on:click={moveLabDown.bind(null, idx)}
                >
                    <Icon src={ArrowDown} class="size-6" />
                </button>
                <button
                    type="button"
                    class="variant-filled-error btn-icon btn-icon-sm"
                    on:click={resetSelection.bind(null, idx)}
                >
                    <Icon src={XMark} class="size-6" />
                </button>
            </div>
        {:else}
            <WarningAlert>No labs selected yet.</WarningAlert>
        {/each}
    </div>
    <hr class="!border-surface-400-500-token !border-t-4" />
    <div class="space-y-2">
        {#each availableLabs as { lab_id, lab_name }, idx (lab_id)}
            <button
                class="card w-full {cardCursor} appearance-none p-4 {cardOpacity} transition"
                transition:slide={{ duration: 120 }}
                on:click={selectLab.bind(null, idx)}>{lab_name}</button
            >
        {:else}
            <ErrorAlert>No more labs with remaining slots left.</ErrorAlert>
        {/each}
    </div>
{/if}
