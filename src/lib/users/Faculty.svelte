<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import type { QueriedFaculty } from '$lib/server/database';

    // eslint-disable-next-line init-declarations
    export let user: QueriedFaculty[number];
    $: ({ email, given_name, family_name, avatar, lab_name } = user);
</script>

<a href="mailto:{email}">
    <Avatar src={avatar} width="w-14" />
    <span class="flex flex-col">
        <strong><span class="uppercase">{family_name}</span>, {given_name}</strong>
        {#if lab_name !== null}
            <span class="text-sm opacity-50">{lab_name}</span>
        {/if}
        <span class="text-xs opacity-50">{email}</span>
    </span>
</a>
