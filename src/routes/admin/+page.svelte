<script lang="ts">
    import type { PageData } from './$types';

    let availableLabs = [
        { id: 0, acronym: "ndsl", name: 'Networks and Distributed Systems Laboratory' },
        { id: 1, name: 'Computer Vision & Machine Intelligence Laboratory' },
        { id: 2, name: 'Service Science & Software Engineering Laboratory' },
        { id: 3, name: 'Algorithms & Complexity Laboratory' },
        { id: 4, name: 'Web Science Laboratory' },
        { id: 5, name: 'Computer Security Laboratory' },
        { id: 6, name: 'System Modelling and Simulation Laboratory' },
        { id: 7, name: 'Scientific Computing Laboratory' },
    ];

    export let data: PageData;
</script>

<section class="space-y-4">
    <h1 class="h1">Set the quota for each laboratory for this draft process</h1>
    <form method="post">
        <div class="table-container my-4">
            <table class="table table-comfortable table-hover">
                <thead>
                    <tr>
                        <th>Laboratory</th>
                        <th class="w-2/5">Input Quota</th>
                    </tr>
                </thead>
                <tbody>
                    {#each availableLabs as {id, name}, idx (id)}
                        <tr>
                            <td>{name}</td>
                            <td><input type="number" required min=0 placeholder="Quota" class="input variant-form-material py-1 px-2"/></td>
                        </tr> 
                    {/each}
                </tbody>
            </table>
        </div>

        <button type="submit" class="btn variant-filled">
            Save Selection
        </button>
    </form>
</section>