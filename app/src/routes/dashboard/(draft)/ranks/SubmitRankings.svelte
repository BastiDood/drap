<script lang="ts">
    import { ArrowDown, ArrowUp, XMark } from '@steeze-ui/heroicons';
    import type { AvailableLabs } from 'drap-database';
    import type { Draft } from 'drap-model/draft';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';

    import ErrorAlert from '$lib/alerts/Error.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';

    // eslint-disable-next-line init-declarations
    export let draftId: Draft['draft_id'];
    // eslint-disable-next-line init-declarations
    export let maxRounds: Draft['max_rounds'];
    // eslint-disable-next-line init-declarations
    export let availableLabs: AvailableLabs;

    const toast = getToastStore();
    let selectedLabs = [] as typeof availableLabs;

    $: remaining = maxRounds - selectedLabs.length;
    $: hasRemaining = remaining > 0;
    $: cardVariant = hasRemaining ? 'variant-ghost-primary' : 'variant-ghost-secondary';

    function selectLab(index: number) {
        if (selectedLabs.length >= maxRounds) return;
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
    use:enhance={({ submitter, cancel }) => {
        if (!confirm(`Are you sure you want to select ${selectedLabs.length} labs?`)) {
            cancel();
            return;
        }
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
                    switch (result.status) {
                        case 400:
                            toast.trigger({
                                message: 'Empty submissions are not allowed.',
                                background: 'variant-filled-error',
                            });
                            break;
                        case 403:
                            toast.trigger({
                                message: 'You have already set your lab preferences before.',
                                background: 'variant-filled-error',
                            });
                            break;
                        default:
                            break;
                    }
                    break;
                default:
                    break;
            }
        };
    }}
>
    <input type="hidden" name="draft" value={draftId} />
    <div class="card {cardVariant} prose dark:prose-invert max-w-none p-4 transition">
        <p>Lab preferences are ordered by preference from top (most preferred) to bottom (least preferred).</p>
        <p>
            {#if hasRemaining}
                You may select up to <strong>{remaining}</strong> labs left.
            {:else}
                You may no longer select any more labs.
            {/if}
        </p>
        <button type="submit" class="variant-filled-primary btn">Submit Lab Preferences</button>
    </div>
    <hr class="!border-surface-400-500-token !border-t-4" />
    {#if selectedLabs.length > 0}
        <ol class="list">
            {#each selectedLabs as { lab_id, lab_name }, idx (lab_id)}
                <input type="hidden" name="labs" value={lab_id} />
                <li class="card variant-ghost-surface card-hover p-4">
                    <span class="text-md variant-filled-secondary badge-icon p-4 text-lg font-bold">{idx + 1}</span>
                    <span class="flex-auto">{lab_name}</span>
                    <span class="flex gap-2">
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
                    </span>
                </li>
            {/each}
        </ol>
    {:else}
        <WarningAlert>No labs selected yet.</WarningAlert>
    {/if}
</form>
<hr class="!border-surface-400-500-token !border-t-4" />
{#if availableLabs.length > 0}
    <ul class="list">
        {#each availableLabs as { lab_id, lab_name }, idx (lab_id)}
            <li>
                <button
                    class="card variant-soft-surface card-hover flex-auto p-4 transition"
                    on:click={selectLab.bind(null, idx)}>{lab_name}</button
                >
            </li>
        {/each}
    </ul>
{:else}
    <ErrorAlert>No more labs with remaining slots left.</ErrorAlert>
{/if}
