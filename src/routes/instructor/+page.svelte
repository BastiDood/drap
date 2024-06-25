<script lang="ts">
    import { assert } from '$lib/assert'
    import type { PageData } from './$types'
    
    export let data: PageData

    // student status refers to whether the student has been selected for the draft or not
    type StudentStatus = "drafted" | "undrafted"
    type Student = {name: string, id: string, email: string, status: StudentStatus}

    // dummy data, expectation is for it to be loaded from page data
    let draftees: Student[] = [
        {name: "Victor Edwin Reyes", id: "2021-01588", email: "vereyes2@up.edu.ph", status: "drafted"},
        {name: "Sebastian Luis Ortiz", id: "2020-XXXXX", email: "slortiz@up.edu.ph", status: "undrafted"},
        {name: "Angelica Raborar", id: "2020-YYYYY", email: "araborar@up.edu.ph", status: "undrafted"},
    ]

    // callback for toggling status on click, note that this must be provided with the new status and id of the element to be changed
    function changeStatusForID(newStatus: StudentStatus, id: string) {
        let student = draftees.find((val) => id == val.id)
        assert(student != undefined)
        student.status = newStatus
        // to ensure reactivity for #each directives referencing draftees
        draftees = draftees
    }
</script>

<div class="w-auto m-10">
    <h3 class="h3">Select desired draftees for this draft round</h3>
    <form method="post">
        <div class = "grid grid-cols-5 w-auto my-6">
            <div class="col-span-2 border-primary-900-50-token">
                Unselected Draftees
                <div>
                    {#each draftees as draftee (draftee.id)}
                        {#if draftee.status == "undrafted"}
                            <div class="bg-red-400 flex flex-row m-4 p-2">
                                <button class="btn-icon variant-filled place-self-center m-4" on:click|preventDefault={() => changeStatusForID("drafted", draftee.id)}>
                                    ✔️
                                </button>
                                <span>
                                    <p>{draftee.name}</p>
                                    <p>{draftee.id}</p>
                                    <p>{draftee.email}</p>
                                </span>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
            <div class="col-span-1 flex flex-col border-secondary-900-50-token h-auto">
                
            </div>
            <div class="col-span-2 border-error-500-400-token">
                Selected Draftees
                <div>
                    {#each draftees as draftee (draftee.id)}
                        {#if draftee.status == "drafted"}
                            <div class="bg-green-400 flex flex-row m-4 p-2">
                                <button class="btn-icon variant-filled place-self-center m-4" on:click|preventDefault={() => changeStatusForID("undrafted", draftee.id)}>
                                    ❌
                                </button>
                                <span>
                                    <p>{draftee.name}</p>
                                    <p>{draftee.id}</p>
                                    <p>{draftee.email}</p>
                                </span>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        </div>
        <button type="submit" class="btn variant-filled">
            Save Selection
        </button>
    </form>
</div>