<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { UserCircle } from '@steeze-ui/heroicons';
    import type { schema } from 'drap-database';

    interface Props extends Pick<schema.User, 'email' | 'givenName' | 'familyName' | 'avatarUrl'> {
        labName: string | null;
    }

    // eslint-disable-next-line init-declarations
    export let user: Props;
    $: ({ email, givenName, familyName, avatarUrl, labName } = user);
</script>

<a href="mailto:{email}">
    <span><Avatar src={avatarUrl} width="w-14"><Icon src={UserCircle} class="w-14" /></Avatar></span>
    <span class="flex flex-col">
        {#if givenName.length > 0 && familyName.length > 0}
            <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
        {/if}
        {#if labName !== null}
            <span class="text-sm opacity-50">{labName}</span>
        {/if}
        <span class="text-xs opacity-50">{email}</span>
    </span>
</a>
