<script lang="ts">
    import { assert } from '$lib/assert.js';
    import { Accordion } from '@skeletonlabs/skeleton';
    import LabAccordion from './LabAccordion.svelte';


    export let data;
    
    let { available, selected, labs } = data;

    assert(available !== undefined)
    assert(selected !== undefined)
    assert(labs !== undefined)

</script>


<!-- Show labs, lab heads, lab quotas, lab membership count as follows -- ( SELECTED / AVAILABLE & PREFERENCE THIS ROUND / AVAILABLE & PREFERENCE FUTURE ROUNDS / QUOTA ) -->
<!-- Detail already-selected lab members, available students with preferences for the lab in the current round -->

<Accordion>
    {#each labs as lab}
        <LabAccordion {available} {selected} {lab} />
    {/each}
</Accordion>