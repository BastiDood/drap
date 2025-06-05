<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import type { schema } from 'drap-database';

    type Lab = Pick<schema.Lab, 'id' | 'name'>;
    type User = Pick<schema.User, 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'>;

    // eslint-disable-next-line init-declarations
    export let labs: Lab[];
    // eslint-disable-next-line init-declarations
    export let user: User;
    $: ({ email, givenName, familyName, avatarUrl, studentNumber } = user);
</script>

<span>
    <Avatar src={avatarUrl} width="w-20" />
</span>
<span class="flex w-full flex-col">
    <strong class="text-sm"><span class="uppercase">{familyName}</span>, {givenName}</strong>
    {#if studentNumber !== null}
        <span class="text-xs opacity-50">{studentNumber}</span>
    {/if}
    <span class="text-xs opacity-50">{email}</span>
    <select name={email} class="select w-full text-xs">
        <option value="" selected>[Undrafted]</option>
        {#each labs as { id, name } (id)}
            <option value={id}>{name}</option>
        {/each}
    </select>
</span>
