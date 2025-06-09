<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import type { schema } from '$lib/server/database';

    interface Props extends Pick<schema.User, 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'> {
        labs: string[];
        labId: string | null;
    }

    // eslint-disable-next-line init-declarations
    export let user: Props;
    $: ({ email, givenName, familyName, avatarUrl, studentNumber, labs, labId } = user);
</script>

<a href="mailto:{email}" class="grid w-full grid-cols-[auto_1fr] items-center gap-2 p-4">
    <span><Avatar src={avatarUrl} width="w-20" /></span>
    <span class="flex flex-col">
        {#if givenName.length > 0 && familyName.length > 0}
            <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
        {/if}
        {#if studentNumber !== null}
            <span class="text-sm opacity-50">{studentNumber}</span>
        {/if}
        <span class="text-xs opacity-50">{email}</span>
        <div class="space-x-1">
            {#if labId === null}
                {#each labs as lab (lab)}
                    <span class="variant-ghost-tertiary badge text-xs uppercase">{lab}</span>
                {/each}
            {:else}
                <span class="variant-ghost-primary badge text-xs uppercase">{labId}</span>
            {/if}
        </div>
    </span>
</a>
