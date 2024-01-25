<script>
    import { AppRail, AppRailAnchor, LightSwitch } from '@skeletonlabs/skeleton';
    import { Home } from '@steeze-ui/heroicons';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { page } from '$app/stores';
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
</AppRail>
