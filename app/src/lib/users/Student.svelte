<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import type { TaggedStudentsWithLabs } from 'drap-database';

    // eslint-disable-next-line init-declarations
    export let user: TaggedStudentsWithLabs[number];
    $: ({ email, given_name, family_name, avatar, student_number, labs, lab_id } = user);
</script>

<a href="mailto:{email}" class="grid w-full grid-cols-[auto_1fr] items-center gap-2 p-4">
    <span><Avatar src={avatar} width="w-20" /></span>
    <span class="flex flex-col">
        {#if given_name.length > 0 && family_name.length > 0}
            <strong><span class="uppercase">{family_name}</span>, {given_name}</strong>
        {/if}
        {#if student_number !== null}
            <span class="text-sm opacity-50">{student_number}</span>
        {/if}
        <span class="text-xs opacity-50">{email}</span>
        <div class="space-x-1">
            {#if lab_id === null}
                {#each labs as lab (lab)}
                    <span class="variant-ghost-tertiary badge text-xs uppercase">{lab}</span>
                {/each}
            {:else}
                <span class="variant-ghost-primary badge text-xs uppercase">{lab_id}</span>
            {/if}
        </div>
    </span>
</a>
