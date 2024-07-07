<script lang="ts">
    import { ArrowDown, ArrowUp, XMark } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { format } from 'date-fns';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { slide } from 'svelte/transition';

    import ErrorAlert from '$lib/alerts/Error.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ availableLabs, draft } = data);

    const toast = getToastStore();
    let selectedLabs = [] as typeof availableLabs;

    $: ({ curr_round, max_rounds, active_period_start } = draft);
    $: startDate = format(active_period_start, 'PPP');
    $: startTime = format(active_period_start, 'pp');
    $: remaining = max_rounds - selectedLabs.length;
    $: hasRemaining = remaining > 0;
    $: cardVariant = hasRemaining ? 'variant-ghost-primary' : 'variant-ghost-secondary';
    $: cardCursor = hasRemaining ? 'cursor-pointer' : 'cursor-not-allowed';
    $: cardOpacity = hasRemaining ? 'opacity-100' : 'opacity-50';

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

<form
    method="post"
    class="space-y-4"
    use:enhance={({ submitter }) => {
        assert(submitter !== null);
        assert(submitter instanceof HTMLButtonElement);
        submitter.disabled = true;
        return async ({ update, result }) => {
            submitter.disabled = false;
            await update({ reset: false });
            switch (result.type) {
                case 'success':
                    toast.trigger({
                        message: 'Uploaded your lab preferences.',
                        background: 'variant-filled-success',
                    });
                    break;
                case 'failure':
                    toast.trigger({
                        message: 'Failed to submit your lab preferences.',
                        background: 'variant-filled-error',
                    });
                    break;
                default:
                    break;
            }
        };
    }}
>
    <div class="card {cardVariant} prose max-w-none p-4 transition dark:prose-invert">
        <p>
            This draft is currently on Round <strong>{curr_round}</strong> of <strong>{max_rounds}</strong>. The draft
            opened last <strong>{startDate}</strong> at <strong>{startTime}</strong>.
        </p>
        <p>Lab preferences are ordered by preference from top (most preferred) to bottom (least preferred).</p>
        <p>
            {#if hasRemaining}
                You may select up to <strong>{remaining}</strong> labs left.
            {:else}
                You may no longer select any more labs.
            {/if}
        </p>
        <button type="submit" disabled={hasRemaining} class="variant-filled-primary btn disabled:!variant-ghost-primary"
            >Submit Lab Preferences</button
        >
    </div>
    <hr class="!border-surface-400-500-token !border-t-4" />
    {#each selectedLabs as { lab_id, lab_name }, idx (lab_id)}
        <div
            class="card grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 p-4"
            transition:slide={{ duration: 120 }}
        >
            <input type="hidden" name="labs" value={lab_id} />
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
</form>
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
