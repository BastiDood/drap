<script lang="ts">
  import { Toaster } from '@skeletonlabs/skeleton-svelte';

  import { initToaster } from '$lib/toast';

  import SideBar from './SideBar.svelte';

  const { data, children } = $props();
  const { user } = $derived(data);

  const toaster = initToaster();
</script>

<Toaster {toaster} />
<div class="flex h-dvh overflow-hidden">
  <SideBar {user} />
  <div class="grow space-y-4 overflow-y-auto p-4">{@render children?.()}</div>
</div>
