<script lang="ts">
    import { AccordionItem } from '@skeletonlabs/skeleton';
    import type { ComponentProps } from 'svelte';
    import Student from '$lib/users/Student.svelte';
    import type { schema } from 'drap-database';

    type Lab = Pick<schema.Lab, 'id' | 'name' | 'quota'>;
    type StudentProps = ComponentProps<Student>['user'];
    interface StudentUser extends StudentProps {
        id: schema.User['id'];
    }

    // eslint-disable-next-line init-declarations
    export let round: number;
    // eslint-disable-next-line init-declarations
    export let lab: Lab;
    // eslint-disable-next-line init-declarations
    export let available: StudentUser[];
    // eslint-disable-next-line init-declarations
    export let selected: StudentUser[];

    $: selected = selected.filter(val => val.labId === lab.id);
    $: preferred = available.filter(val => val.labs[round - 1] === lab.id);
    $: interested = available.filter(val => val.labs.slice(round).includes(lab.id));

    let isOpen = false;
</script>

<AccordionItem bind:open={isOpen}>
    <div class="flex justify-between" slot="summary">
        {#if lab.quota === 0}
            <h5 class="h5 text-gray-400">{lab.name}</h5>
        {:else if selected.length < lab.quota}
            <h5 class="h5">{lab.name}</h5>
        {:else}
            <h5 class="h5 text-warning-500">{lab.name}</h5>
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
                {#each selected as { id, ...student } (id)}
                    <Student user={student} />
                {:else}
                    <div class="space-y-4 m-2 p-2 italic">No students selected yet.</div>
                {/each}
            </div>
            <div>
                Preferred This Round
                {#each preferred as { id, ...student } (id)}
                    <Student user={student} />
                {:else}
                    <div class="space-y-4 m-2 p-2 italic">No students prefer this lab for this round.</div>
                {/each}
            </div>
            <div>
                Interested in Future Rounds
                {#each interested as { id, ...student } (id)}
                    <Student user={student} />
                {:else}
                    <div class="space-y-4 m-2 p-2 italic">No remaining students are interested in this lab.</div>
                {/each}
            </div>
        </div>
    </div>
</AccordionItem>
