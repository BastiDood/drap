<script lang="ts">
    import { assert } from '$lib/assert'
    import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
    import type { PageData } from './$types'
    
    export let data: PageData

    // student status refers to whether the student has been selected for the draft or not
    type StudentStatus = "drafted" | "undrafted"
    type Student = {name: string, id: string, email: string}

    // dummy data, expectation is for it to be loaded from page data
    let students: Student[] = [
        {name: "Victor Edwin Reyes", id: "2021-01588", email: "vereyes2@up.edu.ph"},
        {name: "Sebastian Luis Ortiz", id: "2020-XXXXX", email: "slortiz@up.edu.ph"},
        {name: "Angelica Raborar", id: "2020-YYYYY", email: "araborar@up.edu.ph"},
    ]

    let draftees: string[] = [

    ]

</script>

<section class="space-y-4">
    <h1 class="h1">Select desired draftees for this draft round</h1>
    <form method="post">
        <div class="m-8">
            <ListBox multiple rounded="rounded">
                {#each students as student}
                    <ListBoxItem bind:group={draftees} name="medium" value={student.id}>
                        <div class="p-1">
                            <p>{student.name}</p>
                            <p>{student.id}</p>
                            <p>{student.email}</p>
                        </div>
                    </ListBoxItem>
                {/each}
            </ListBox>
            <button type="submit" class="btn variant-filled">
                Save Selection
            </button>
        </div>
    </form>
</section>