<script lang="ts">
    import type { PageData } from './src/routes/instructor/$types'
    
    export let data: PageData

    type StudentStatus = "selected" | "unselected"
    type Student = {name: string, id: string, email: string, status: StudentStatus}

    let draftees: Student[] = [
        {name: "Victor Edwin Reyes", id: "2021-01588", email: "vereyes2@up.edu.ph", status: "unselected"},
        {name: "Sebastian Luis Ortiz", id: "2020-XXXXX", email: "slortiz@up.edu.ph", status: "unselected"},
        {name: "Angelica Raborar", id: "2020-YYYYY", email: "araborar@up.edu.ph", status: "unselected"},
    ]
</script>

<div class="w-auto m-10">
    <h3 class="h3">Select desired draftees for this draft round</h3>
    <div class = "grid grid-cols-5 w-auto my-6">
        <div class="col-span-2 border-primary-900-50-token">
            Unselected Draftees
            <div>
                
            </div>
        </div>
        <div class="col-span-1 border-secondary-900-50-token">
            Controls
        </div>
        <div class="col-span-2 border-error-500-400-token">
            Selected Draftees
            <div>

            </div>
        </div>
    </div>
</div>