<script>
    import './app.css';
    import { AppShell, Toast, initializeStores } from '@skeletonlabs/skeleton';
    import SideBar from './SideBar.svelte';
    import favicon from '$lib/favicon.ico?url';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ user } = data);

    initializeStores();
</script>

<svelte:head>
    <link rel="icon" href={favicon} />
</svelte:head>

<Toast />
<AppShell>
    <SideBar slot="sidebarLeft" {user} />
    <div class="h-full space-y-4 p-4"><slot /></div>
</AppShell>
