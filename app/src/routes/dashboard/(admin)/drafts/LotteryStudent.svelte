<script lang="ts">
    import type { AvailableLabs, TaggedStudentsWithLabs } from 'drap-database';
    import { Avatar } from '@skeletonlabs/skeleton';

    // eslint-disable-next-line init-declarations
    export let labs: AvailableLabs;
    // eslint-disable-next-line init-declarations
    export let user: TaggedStudentsWithLabs[number];
    $: ({ email, given_name, family_name, avatar, student_number } = user);
</script>

<span>
    <Avatar src={avatar} width="w-20" />
</span>
<span class="flex w-full flex-col">
    <strong class="text-sm"><span class="uppercase">{family_name}</span>, {given_name}</strong>
    {#if student_number !== null}
        <span class="text-xs opacity-50">{student_number}</span>
    {/if}
    <span class="text-xs opacity-50">{email}</span>
    <select name={email} class="select w-full text-xs">
        <option value="" selected>[Undrafted]</option>
        {#each labs as { lab_id, lab_name } (lab_id)}
            <option value={lab_id}>{lab_name}</option>
        {/each}
    </select>
</span>
