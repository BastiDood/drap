<script lang="ts">
    import type { PageData } from './$types';

    let availableLabs = [
        { id: 0, name: 'Networks and Distributed Systems Laboratory' },
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
        <div class="space-y-2">
            {#each availableLabs as {id, name}, idx (id)}
                <div class="card w-full cursor-pointer appearance-none p-4">
                    {name}
                </div>
            {/each}
        </div>
    </form>
</section>