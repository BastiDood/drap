<script lang="ts">
  import './app.css';
  import SideBar from './SideBar.svelte';
  import { Toaster } from '@skeletonlabs/skeleton-svelte';
  import banner from '$lib/banner.png?url';
  import { initToaster } from '$lib/toast';

  const { data, children } = $props();
  const { user } = $derived(data);

  const toaster = initToaster();
</script>

<svelte:head>
  <meta property="og:image" content="https://drap.dcs.upd.edu.ph{banner}" />
</svelte:head>

<Toaster {toaster} />
<div class="flex h-dvh overflow-hidden">
  <SideBar {user} />
  <div class="grow space-y-4 overflow-y-auto p-4">{@render children?.()}</div>
</div>
