<script lang="ts">
    import { AppRail, AppRailAnchor, Avatar, LightSwitch } from '@skeletonlabs/skeleton';
    import { Beaker, ClipboardDocumentList, Home, QueueList, UserCircle, Users } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import type { User } from '$lib/models/user';
    import { page } from '$app/stores';

    // eslint-disable-next-line init-declarations
    export let user: User | undefined;

    $: ({ pathname } = $page.url);
</script>

<AppRail width="w-20">
    <div slot="lead" class="my-4 flex items-center justify-center">
        <LightSwitch />
    </div>
    <AppRailAnchor href="/" selected={pathname === '/'}>
        <Icon src={Home} slot="lead" class="h-8" />
        <span>Home</span>
    </AppRailAnchor>
    {#if typeof user !== 'undefined' && user.user_id !== null}
        <AppRailAnchor href="/profile/" selected={pathname === '/profile/'}>
            <Icon src={UserCircle} slot="lead" class="h-8" />
            <span>Profile</span>
        </AppRailAnchor>
        {#if user.lab_id === null}
            {#if user.is_admin}
                <!-- Registered Admin -->
                <AppRailAnchor href="/dashboard/drafts/" selected={pathname === '/dashboard/drafts/'}>
                    <Icon src={ClipboardDocumentList} slot="lead" class="h-8" />
                    <span>Drafts</span>
                </AppRailAnchor>
                <AppRailAnchor href="/dashboard/users/" selected={pathname === '/dashboard/users/'}>
                    <Icon src={Users} slot="lead" class="h-8" />
                    <span>Users</span>
                </AppRailAnchor>
                <AppRailAnchor href="/dashboard/labs/" selected={pathname === '/dashboard/labs/'}>
                    <Icon src={Beaker} slot="lead" class="h-8" />
                    <span>Labs</span>
                </AppRailAnchor>
            {:else}
                <!-- Registered User -->
                <AppRailAnchor href="/dashboard/ranks/" selected={pathname.startsWith('/dashboard/ranks/')}>
                    <Icon src={QueueList} slot="lead" class="h-8" />
                    <span>Ranks</span>
                </AppRailAnchor>
            {/if}
        {:else if user.is_admin}
            <!-- TODO: Registered Faculty -->
        {/if}
    {/if}
    <div slot="trail" class="my-4 flex aspect-square flex-col items-center justify-center gap-2">
        {#if typeof user !== 'undefined'}
            <Avatar src={user.avatar} />
        {/if}
    </div>
</AppRail>
