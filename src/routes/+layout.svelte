<script lang="ts">
  import './app.css';
  import { AppShell, Toast, initializeStores } from '@skeletonlabs/skeleton';
  import SideBar from './SideBar.svelte';
  import banner from '$lib/banner.png?url';

  const { data, children } = $props();
  const { user } = $derived(data);

  initializeStores();
</script>

<svelte:head>
  <meta property="og:image" content="https://drap.dcs.upd.edu.ph{banner}" />
</svelte:head>

<Toast />
<AppShell>
  {#snippet sidebarLeft()}
    <SideBar {user} />
  {/snippet}
  <div class="h-full space-y-4 p-4">{@render children?.()}</div>
</AppShell>
