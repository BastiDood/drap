<script lang="ts">
    import { assert } from '$lib/assert';
    import type { PageData } from './$types';
    
    export let data: PageData;

    type StudentStatus = "selected" | "unselected" | "dragging"
    type Student = {name: string, id: string, email: string, status: StudentStatus}

    // these draftee lists are expected to be provided from the page data on load
    let draftees: Student[] = []
    
    $: draftees = [
        {name: "Victor Edwin Reyes", id: "2021-01588", email: "vereyes2@up.edu.ph", status: "unselected"},
        {name: "Sebastian Luis Ortiz", id: "2020-XXXXX", email: "slortiz@up.edu.ph", status: "unselected"},
        {name: "Angelica Raborar", id: "2020-YYYYY", email: "araborar@up.edu.ph", status: "unselected"},
    ]

    // these functions are drag event handlers, all event modifiers should be in on directives

    function handleDragStudentStart(e: DragEvent, transferObject: Student) {
        assert(e.dataTransfer)
        transferObject.status = "dragging"
        e.dataTransfer.setData("json", JSON.stringify(transferObject))
        e.dataTransfer.dropEffect = "move"
    }

    function handleDragEnd(e: DragEvent) {

    }

    // handles a drag and drop into an element with an associated drafteesList (must be an array of students)
    function handleDragDropIntoList(e: DragEvent, newStatus: StudentStatus) {
        assert(e.dataTransfer)
        let transferObject = e.dataTransfer.getData("json")
    }

</script>

<div class="w-auto m-10">
    <h3 class="h3">Drag and Drop desired draftees for this draft round</h3>
    <div class = "grid grid-cols-5 w-auto my-6">
        <div class="col-span-2 border-primary-900" on:dragover|preventDefault on:drop={(e) => handleDragDropIntoList(e, "unselected")}>
            Unselected Draftees
            {#each draftees as draftee (draftee.id)}
                <div 
                    class="bg-red-300 m-2 p-2 w-60"
                    draggable=true
                    on:dragstart={(e) => handleDragStudentStart(e, draftee)}
                    on:dragend={handleDragEnd}
                >
                    <p>{draftee.name}</p>
                    <p>{draftee.id}</p>
                    <p>{draftee.email}</p>
                </div>
            {/each}
        </div>
        <div class="col-span-1 border-secondary-900">
            Controls
        </div>
        <div class="col-span-2 border-error-500" on:dragover|preventDefault on:drop={(e) => handleDragDropIntoList(e, "selected")}>
            Selected Draftees
            {#each draftees as draftee (draftee.id)}
                    <div 
                        class="bg-red-300 m-2 p-2 w-60"
                        draggable=true
                        on:dragstart={(e) => handleDragStudentStart(e, draftee)}
                        on:dragend={handleDragEnd}
                    >
                    <p>{draftee.name}</p>
                    <p>{draftee.id}</p>
                    <p>{draftee.email}</p>
                </div>
            {/each}
        </div>
    </div>
</div>