<script lang="ts">
    import { ArrowDown, ArrowUp, XMark } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { assert } from '$lib/assert';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { slide } from 'svelte/transition';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ availableLabs, draft } = data);

    let selectedLabs = [] as typeof availableLabs;

    const toast = getToastStore();

    function selectLab(index: number) {
        assert(draft !== null);
        if (selectedLabs.length >= draft.max_rounds) {
            toast.trigger({
                message: 'Maximum selected labs reached.',
                background: 'variant-filled-error',
            });
            return;
        }

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

<h1 class="h1 mb-2">Draft Registration</h1>
{#if draft === null}
    <WarningAlert>There is no active draft at the moment. Please check again later.</WarningAlert>
{:else}
    <div class="space-y-2">
        {#each availableLabs as { lab_id, lab_name }, idx (lab_id)}
            <button
                class="card w-full cursor-pointer appearance-none p-4"
                transition:slide={{ duration: 120 }}
                on:click={selectLab.bind(null, idx)}>{lab_name}</button
            >
        {:else}
            <WarningAlert>No more labs left.</WarningAlert>
        {/each}
    </div>
    <hr class="!border-primary-400-500-token !border-t-4" />
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
{/if}
