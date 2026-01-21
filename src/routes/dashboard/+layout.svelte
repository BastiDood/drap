<script lang="ts">
  import { SidebarProvider } from '$lib/components/ui/sidebar';
  import { Toaster } from '$lib/components/ui/sonner';

  import SideBar from './side-bar.svelte';

  const { data, children } = $props();
  const { user } = $derived(data);
</script>

<Toaster />
<SidebarProvider>
  <div class="flex h-dvh w-full overflow-hidden">
    <SideBar {user} />
    <main class="grow space-y-4 overflow-y-auto p-4">{@render children?.()}</main>
  </div>
</SidebarProvider>
