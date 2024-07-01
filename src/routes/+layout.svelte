<script>
    import './app.css';
    import { AppShell, Toast, initializeStores } from '@skeletonlabs/skeleton';
    import SideBar from './SideBar.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ user } = data);
    $: avatar = user?.avatar ?? null;

    initializeStores();
</script>

<Toast />
<AppShell>
    <SideBar slot="sidebarLeft" {avatar} />
    <div class="h-full p-4"><slot /></div>
</AppShell>
