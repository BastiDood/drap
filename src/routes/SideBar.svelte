<script lang="ts">
    import { AcademicCap, Beaker, BuildingLibrary, Home } from '@steeze-ui/heroicons';
    import { AppRail, AppRailAnchor, Avatar, LightSwitch } from '@skeletonlabs/skeleton';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { page } from '$app/stores';

    // eslint-disable-next-line init-declarations
    export let avatar: string | null;

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
    <div slot="trail" class="my-4 flex aspect-square flex-col items-center justify-center gap-2">
        {#if avatar !== null}
            <Avatar src={avatar} />
        {/if}
    </div>
</AppRail>
