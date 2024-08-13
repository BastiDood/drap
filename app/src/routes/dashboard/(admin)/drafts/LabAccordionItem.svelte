<script lang="ts">
    import { AccordionItem } from '@skeletonlabs/skeleton';
    import type { Lab } from 'drap-model/lab';
    import Student from '$lib/users/Student.svelte';
    import type { TaggedStudentsWithLabs } from 'drap-database';

    // eslint-disable-next-line init-declarations
    export let round: number;
    // eslint-disable-next-line init-declarations
    export let lab: Lab;
    // eslint-disable-next-line init-declarations
    export let available: TaggedStudentsWithLabs;
    // eslint-disable-next-line init-declarations
    export let selected: TaggedStudentsWithLabs;

    $: selected = selected.filter(val => val.lab_id === lab.lab_id);
    $: preferred = available.filter(val => val.labs[round - 1] === lab.lab_id);
    $: interested = available.filter(val => val.labs.slice(round).includes(lab.lab_id));

    let isOpen = false;
</script>

<AccordionItem bind:open={isOpen}>
    <div class="flex justify-between" slot="summary">
        {#if lab.quota === 0}
            <h5 class="h5 text-gray-400">{lab.lab_name}</h5>
        {:else if selected.length < lab.quota}
            <h5 class="h5">{lab.lab_name}</h5>
        {:else}
            <h5 class="h5 text-warning-500">{lab.lab_name}</h5>
        {/if}
        <span>
            <span class="variant-ghost-primary badge font-mono text-xs uppercase"
                >{selected.length} {isOpen ? 'members' : ''}</span
            >
            <span class="variant-ghost-tertiary badge font-mono text-xs uppercase"
                >{preferred.length} {isOpen ? 'preferred' : ''}</span
            >
            <span class="variant-ghost-warning badge font-mono text-xs uppercase"
                >{lab.quota} {isOpen ? 'maximum' : ''}</span
            >
        </span>
    </div>
    <div slot="content">
        <hr class="p-2" />
        <div class="grid grid-cols-3">
            <div>
                Members / Already Selected
                {#each selected as student (student.email)}
                    <Student user={student} />
                {:else}
                    <div class="space-y-4 m-2 p-2 italic">No students selected yet.</div>
                {/each}
            </div>
            <div>
                Preferred This Round
                {#each preferred as student (student.email)}
                    <Student user={student} />
                {:else}
                    <div class="space-y-4 m-2 p-2 italic">No students prefer this lab for this round.</div>
                {/each}
            </div>
            <div>
                Interested in Future Rounds
                {#each interested as student (student.email)}
                    <Student user={student} />
                {:else}
                    <div class="space-y-4 m-2 p-2 italic">No remaining students are interested in this lab.</div>
                {/each}
            </div>
        </div>
    </div>
</AccordionItem>
