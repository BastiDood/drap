<script lang="ts">
    import type { PageData } from './$types';
    
    export let data: PageData;

    type Student = {name: string, id: string, email: string}

    // these draftee lists are expected to be provided from the page data on load
    let unselected_draftees: Student[] = [
        {name: "Victor Edwin Reyes", id: "2021-01588", email: "vereyes2@up.edu.ph"},
        {name: "Sebastian Luis Ortiz", id: "2020-XXXXX", email: "slortiz@up.edu.ph"},
        {name: "Angelica Raborar", id: "2020-XXXXX", email: "araborar@up.edu.ph"},
    ]

    let selected_draftees: Student[] = {

    }

</script>

<div class="w-auto m-10">
    <h3 class="h3">Drag and Drop desired draftees for this draft round</h3>
    <div class = "grid grid-cols-5 w-auto my-6">
        <div class="col-span-2 border-primary-900">
            Unselected Draftees
        </div>
        <div class="col-span-1 border-secondary-900">
            Controls
        </div>
        <div class="col-span-2 border-error-500">
            Selected Draftees
        </div>
    </div>
</div>