<script lang="ts">
    import { Accordion } from '@skeletonlabs/skeleton';
    import LabAccordion from './LabAccordion.svelte';

    import { assert } from '$lib/assert.js';

    // eslint-disable-next-line init-declarations
    export let data;

    const { available, selected, labs, draft } = data;

    assert(typeof available !== 'undefined');
    assert(typeof selected !== 'undefined');
    assert(typeof labs !== 'undefined');
    assert(typeof draft !== 'undefined');
</script>

<!-- Show labs, lab heads, lab quotas, lab membership count as follows -- ( SELECTED / AVAILABLE & PREFERENCE THIS ROUND / AVAILABLE & PREFERENCE FUTURE ROUNDS / QUOTA ) -->
<!-- Detail already-selected lab members, available students with preferences for the lab in the current round -->

<Accordion>
    {#each labs as lab}
        <LabAccordion
            available={available.filter(val => val.labs.includes(lab.lab_id))}
            selected={selected.filter(val => val.lab_id === lab.lab_id)}
            {lab}
            curr_round={draft.curr_round}
        />
    {/each}
</Accordion>
