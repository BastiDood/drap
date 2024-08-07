<script lang="ts">
    import Student from '$lib/users/Student.svelte';

    import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
    import { CheckCircle, QuestionMarkCircle } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { assert } from '$lib/assert';

    export let data;

    const { available, selected } = data;
    assert(available != undefined && selected != undefined);
</script>

<Accordion>
    <AccordionItem open>
        <Icon src={CheckCircle} slot="lead" class="h-8" />
        <span slot="summary">Available ({available.length}/{available.length + selected.length})</span>
        <svelte:fragment slot="content">
            {#each available as student}
                <Student user={student} />
            {/each}
        </svelte:fragment>
    </AccordionItem>
    <AccordionItem>
        <Icon src={QuestionMarkCircle} slot="lead" class="h-8" />
        <span slot="summary">Already Selected ({selected.length}/{available.length + selected.length})</span>
        <svelte:fragment slot="content">
            {#each selected as student}
                <Student user={student} />
            {/each}
        </svelte:fragment>
    </AccordionItem>
</Accordion>
