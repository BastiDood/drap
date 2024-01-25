<script>
    import './app.css';
    import { AppShell, Toast, initializeStores } from '@skeletonlabs/skeleton';
    import SideBar from './SideBar.svelte';
    initializeStores();
</script>

<Toast />
<AppShell>
    <SideBar slot="sidebarLeft" />
    <slot />
</AppShell>
