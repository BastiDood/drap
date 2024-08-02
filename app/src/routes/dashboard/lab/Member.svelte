<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import { Icon } from '@steeze-ui/svelte-icon';
    import type { QueriedLabMembers } from 'drap-database';
    import { UserCircle } from '@steeze-ui/heroicons';

    // eslint-disable-next-line init-declarations
    export let user: QueriedLabMembers[number];
    $: ({ email, given_name, family_name, avatar, student_number } = user);
</script>

<a href="mailto:{email}">
    <Avatar src={avatar} width="w-14"><Icon src={UserCircle} class="w-14" /></Avatar>
    <span class="flex flex-col">
        {#if given_name.length > 0 && family_name.length > 0}
            <strong><span class="uppercase">{family_name}</span>, {given_name}</strong>
        {/if}
        {#if student_number !== null}
            <span class="text-xs opacity-50">{student_number}</span>
        {/if}
        <span class="text-xs opacity-50">{email}</span>
    </span>
</a>
