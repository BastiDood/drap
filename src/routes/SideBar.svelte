<script lang="ts">
    import { AppRail, AppRailAnchor, Avatar, LightSwitch } from '@skeletonlabs/skeleton';
    import { ClipboardDocumentList, Home, QueueList } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import type { User } from '$lib/models/user';
    import { page } from '$app/stores';

    // eslint-disable-next-line init-declarations
    export let user: User | null;

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
    {#if user === null}
        <!-- No User -->
    {:else if user.is_admin}
        <!-- TODO: Draft Administrator -->
    {:else if user.student_number === null}
        <!-- Uninitialized User -->
        <AppRailAnchor href="/dashboard/register/" selected={pathname === '/dashboard/register/'}>
            <Icon src={ClipboardDocumentList} slot="lead" class="h-8" />
            <span>Register</span>
        </AppRailAnchor>
    {:else if user.student_number === 0n}
        <!-- TODO: Laboratory Head -->
    {:else}
        <!-- TODO: Student -->
        <AppRailAnchor href="/dashboard/rank/" selected={pathname === '/dashboard/register/'}>
            <Icon src={QueueList} slot="lead" class="h-8" />
            <span>Rank</span>
        </AppRailAnchor>
    {/if}
    <!--
    <AppRailAnchor href="/student/" selected={pathname === '/student/'}>
        <Icon src={AcademicCap} slot="lead" class="h-8" />
        <span>Student</span>
    </AppRailAnchor>
    <AppRailAnchor href="/instructor/" selected={pathname === '/instructor/'}>
        <Icon src={Beaker} slot="lead" class="h-8" />
        <span>Instructor</span>
    </AppRailAnchor>
    <AppRailAnchor href="/admin/" selected={pathname === '/admin/'}>
        <Icon src={BuildingLibrary} slot="lead" class="h-8" />
        <span>Admin</span>
    </AppRailAnchor>
    -->
    <div slot="trail" class="my-4 flex aspect-square flex-col items-center justify-center gap-2">
        {#if user !== null}
            <Avatar src={user.avatar} />
        {/if}
    </div>
</AppRail>
