<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import { Icon } from '@steeze-ui/svelte-icon';
    import type { QueriedFaculty } from 'drap-database';
    import { UserCircle } from '@steeze-ui/heroicons';

    // eslint-disable-next-line init-declarations
    export let user: QueriedFaculty[number];
    $: ({ email, avatar, lab_name } = user);
</script>

<a href="mailto:{email}">
    <span><Avatar src={avatar} width="w-14"><Icon src={UserCircle} class="w-14" /></Avatar></span>
    <span class="flex flex-col">
        <strong>{email}</strong>
        {#if lab_name !== null}
            <span class="text-sm opacity-50">{lab_name}</span>
        {/if}
    </span>
</a>
