<script lang="ts">
    import { assert } from "$lib/assert";
    import Student from "$lib/users/Student.svelte";
    import { AccordionItem } from "@skeletonlabs/skeleton";
    import type { TaggedStudentsWithLabs } from "drap-database";
    import type { Lab } from "drap-model/lab";

    export let lab: Lab;
    export let available: TaggedStudentsWithLabs;
    export let selected: TaggedStudentsWithLabs;
    export let curr_round: number | null;
    
    assert(curr_round !== null)
    
    let preferred = available.filter( (val) => val.labs[curr_round] == lab.lab_id)
    let interested = available.filter( (val) => val.labs.slice(curr_round + 1).includes(lab.lab_id) )

    let isOpen = false;
</script>

<AccordionItem bind:open={isOpen}>
    <div class="flex justify-between" slot="summary">
        <span>{lab.lab_name}</span>
        <span>{selected.length} {isOpen ? "members" : ""} / {preferred.length} {isOpen ? "preferred" : ""} / {lab.quota} {isOpen ? "maximum" : ""}</span>
    </div>
    <div slot="content">
        <div class="grid grid-cols-3">
            <div>
                Members / Already selected
                {#each selected as student}
                    <Student user={student}/>
                {/each}
            </div>
            <div>
                Preferred this round
                {#each preferred as student}
                    <Student user={student}/>
                {/each}
            </div>
            <div>
                Interested in future round
                {#each interested as student}
                    <Student user={student}/>
                {/each}
            </div>
        </div>
    </div>
</AccordionItem>