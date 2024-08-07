<script lang="ts">
    import type { RegisteredLabs, TaggedStudentsWithLabs } from '$lib/server/database';
    import Student from '$lib/users/Student.svelte';

    import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
    import { CheckCircle, QuestionMarkCircle } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';

    // eslint-disable-next-line init-declarations
    export let available: TaggedStudentsWithLabs;
    // eslint-disable-next-line init-declarations
    export let selected: TaggedStudentsWithLabs;
    // eslint-disable-next-line init-declarations
    export let labs: RegisteredLabs;
</script>

<Accordion>
    <AccordionItem>
        <Icon src={CheckCircle} slot="lead" class="h-8" />
        <span slot="summary">Available</span>
        <svelte:fragment slot="content">
            {#each available as student}
                <Student user={student} />
            {/each}
        </svelte:fragment>
    </AccordionItem>
    <AccordionItem>
        <Icon src={QuestionMarkCircle} slot="lead" class="h-8" />
        <span slot="summary">Already Selected</span>
        <svelte:fragment slot="content">
            {#each selected as student}
                <Student user={student} />
            {/each}
        </svelte:fragment>
    </AccordionItem>
</Accordion>
