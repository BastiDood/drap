<script lang="ts">
    import { ArrowDown, ArrowUp, XMark } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import WarningAlert from '$lib/alerts/Warning.svelte';
    import { assert } from '$lib/assert';
    import { slide } from 'svelte/transition';

    let availableLabs = [
        { id: 0, name: 'Algorithms & Complexity Laboratory' },
        { id: 1, name: 'Automata, Combinatorics, & Logic Research Laboratory' },
        { id: 2, name: 'Computer Security Laboratory' },
        { id: 3, name: 'Computer Vision & Machine Intelligence Laboratory' },
        { id: 4, name: 'Networks & Distributed Systems Laboratory' },
        { id: 5, name: 'Scientific Computing Laboratory' },
        { id: 6, name: 'Service Science & Software Engineering Laboratory' },
        { id: 7, name: 'System Modelling & Simulation Laboratory' },
        { id: 8, name: 'Web Science Laboratory' },
    ];
    let selectedLabs = [] as typeof availableLabs;

    function selectLab(index: number) {
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

<section class="space-y-4">
    <h1 class="h1 mb-2">Draft Registration</h1>
    <div class="space-y-2">
        {#each availableLabs as { id, name }, idx (id)}
            <button
                class="card w-full cursor-pointer appearance-none p-4"
                transition:slide={{ duration: 120 }}
                on:click={selectLab.bind(null, idx)}>{name}</button
            >
        {:else}
            <WarningAlert>No more labs left.</WarningAlert>
        {/each}
    </div>
    <hr class="!border-primary-400-500-token !border-t-4" />
    <div class="space-y-2">
        {#each selectedLabs as { id, name }, idx (id)}
            <div
                class="card grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 p-4"
                transition:slide={{ duration: 120 }}
            >
                <span>{name}</span>
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
</section>
