<script lang="ts">
    import Faculty from '$lib/users/Faculty.svelte';
    import Invited from '$lib/users/Invited.svelte';
    import type { schema } from 'drap-database';
    import type { ComponentProps } from 'svelte';

    type FacultyPropsUser = ComponentProps<Faculty>['user'];
    interface FacultyUser extends FacultyPropsUser {
        id: schema.User['id'];
    }

    type InvitedPropsUser = ComponentProps<Invited>['user'];
    interface InvitedUser extends InvitedPropsUser {
        id: schema.User['id'];
    }

    // eslint-disable-next-line init-declarations
    export let invited: InvitedUser[];
    // eslint-disable-next-line init-declarations
    export let registered: FacultyUser[];
</script>

<div class="grid grid-cols-1 md:grid-cols-2">
    <nav class="list-nav space-y-2">
        <h4 class="h4">Invited</h4>
        <ul>
            {#each invited as { id, ...head } (id)}
                <li><Invited user={head} /></li>
            {/each}
        </ul>
    </nav>
    <nav class="list-nav space-y-2">
        <h4 class="h4">Registered</h4>
        <ul>
            {#each registered as { id, ...head } (id)}
                <li><Faculty user={head} /></li>
            {/each}
        </ul>
    </nav>
</div>
