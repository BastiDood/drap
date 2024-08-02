<script lang="ts">
    import Faculty from '$lib/users/Faculty.svelte';
    import Invited from '$lib/users/Invited.svelte';
    import type { QueriedFaculty } from 'drap-database';

    // eslint-disable-next-line init-declarations
    export let invited: QueriedFaculty;
    // eslint-disable-next-line init-declarations
    export let registered: QueriedFaculty;
</script>

<div class="grid grid-cols-1 md:grid-cols-2">
    <nav class="list-nav space-y-2">
        <h4 class="h4">Invited</h4>
        <ul>
            {#each invited as head (head.email)}
                <li><Invited user={head} /></li>
            {/each}
        </ul>
    </nav>
    <nav class="list-nav space-y-2">
        <h4 class="h4">Registered</h4>
        <ul>
            {#each registered as head (head.email)}
                <li><Faculty user={head} /></li>
            {/each}
        </ul>
    </nav>
</div>
