<script lang="ts">
    import { assert } from '$lib/assert';
    import type { PageData } from './$types';
    
    export let data: PageData;

    type Student = {name: string, id: string, email: string}

    // these draftee lists are expected to be provided from the page data on load
    let unselectedDraftees: Student[] = [
        {name: "Victor Edwin Reyes", id: "2021-01588", email: "vereyes2@up.edu.ph"},
        {name: "Sebastian Luis Ortiz", id: "2020-XXXXX", email: "slortiz@up.edu.ph"},
        {name: "Angelica Raborar", id: "2020-XXXXX", email: "araborar@up.edu.ph"},
    ]
    
    let selectedDraftees: Student[] = [

    ]

    // these functions are drag event handlers, all event modifiers should be in on directives

    function handleDragStart(e: DragEvent) {
        assert(e.dataTransfer)
        e.dataTransfer.dropEffect = "move"
    }

    function handleDragEnd(e: DragEvent) {

    }

    // handles a drag and drop into an element with an associated drafteesList (must be an array of students)
    function handleDragDropIntoList(e: DragEvent, drafteesList: Student[]) {

    }

</script>

<div class="w-auto m-10">
    <h3 class="h3">Drag and Drop desired draftees for this draft round</h3>
    <div class = "grid grid-cols-5 w-auto my-6">
        <div class="col-span-2 border-primary-900">
            Unselected Draftees
            {#each unselectedDraftees as draftee (draftee.id)}
                <div class="bg-red-300 m-2 p-2 w-60">
                    <p>{draftee.name}</p>
                    <p>{draftee.id}</p>
                    <p>{draftee.email}</p>
                </div>
            {/each}
        </div>
        <div class="col-span-1 border-secondary-900">
            Controls
        </div>
        <div class="col-span-2 border-error-500">
            Selected Draftees
            {#each selectedDraftees as draftee (draftee.id)}
                <div class="bg-green-300 m-2 p-2 w-60">
                    <p>{draftee.name}</p>
                    <p>{draftee.id}</p>
                    <p>{draftee.email}</p>
                </div>
            {/each}
        </div>
    </div>
</div>