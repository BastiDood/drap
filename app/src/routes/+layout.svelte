<script>
    import './app.css';
    import { AppShell, Toast, initializeStores } from '@skeletonlabs/skeleton';
    import SideBar from './SideBar.svelte';
    import banner from '$lib/banner.png?url';
    import favicon from '$lib/favicon.ico?url';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ user } = data);

    initializeStores();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
    <meta property="og:image" content="https://drap.dcs.upd.edu.ph{banner}" />
</svelte:head>

<Toast />
<AppShell>
    <SideBar slot="sidebarLeft" {user} />
    <div class="h-full space-y-4 p-4"><slot /></div>
</AppShell>
