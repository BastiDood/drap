<script lang="ts">
    import type { PageData } from './src/routes/instructor/$types'
    
    export let data: PageData

    type StudentStatus = "selected" | "unselected"
    type Student = {name: string, id: string, email: string, status: StudentStatus}

    let draftees: Student[] = [
        {name: "Victor Edwin Reyes", id: "2021-01588", email: "vereyes2@up.edu.ph", status: "selected"},
        {name: "Sebastian Luis Ortiz", id: "2020-XXXXX", email: "slortiz@up.edu.ph", status: "unselected"},
        {name: "Angelica Raborar", id: "2020-YYYYY", email: "araborar@up.edu.ph", status: "unselected"},
    ]

    function changeStatusForID(newStatus: StudentStatus, id: string) {
    
    }
</script>

<div class="w-auto m-10">
    <h3 class="h3">Select desired draftees for this draft round</h3>
    <div class = "grid grid-cols-5 w-auto my-6">
        <div class="col-span-2 border-primary-900-50-token">
            Unselected Draftees
            <div>
                {#each draftees as draftee (draftee.id)}
                    {#if draftee.status == "unselected"}
                        <div class="bg-red-400 flex flex-row m-4 p-2">
                            <button class="btn-icon variant-filled place-self-center m-4">
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
                    {#if draftee.status == "selected"}
                        <div class="bg-green-400 flex flex-row m-4 p-2">
                            <button class="btn-icon variant-filled place-self-center m-4">
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
</div>