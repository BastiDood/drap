<script>
    import './app.css';
    import { AppShell, Toast, initializeStores } from '@skeletonlabs/skeleton';
    import SideBar from './SideBar.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ user } = data);

    initializeStores();
</script>

<Toast />
<AppShell>
    <SideBar slot="sidebarLeft" {user} />
    <div class="h-full p-4"><slot /></div>
</AppShell>
