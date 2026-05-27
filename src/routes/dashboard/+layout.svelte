<script>
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  import BottomNav from '$lib/components/bottom-nav.svelte';
  import { browser, dev } from '$app/environment';
  import { DevTools } from '$lib/features/dev-tools';
  import { SidebarProvider } from '$lib/components/ui/sidebar';
  import { Toaster } from '$lib/components/ui/sonner';

  import SideBar from './side-bar.svelte';

  const { data, children } = $props();
  const { user } = $derived(data);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
        staleTime: Infinity,
        refetchOnMount: false,
      },
    },
  });
</script>

<QueryClientProvider client={queryClient}>
  <Toaster richColors closeButton mobileOffset={{ bottom: '80px' }} />
  <SidebarProvider>
    <div class="flex h-dvh w-full overflow-hidden">
      <SideBar {user} />
      <div class="flex min-w-0 grow flex-col">
        <main class="m-4 flex grow flex-col gap-4 overflow-y-auto">
          {@render children?.()}
        </main>
        <BottomNav />
      </div>
    </div>
  </SidebarProvider>
  {#if dev && typeof user !== 'undefined'}
    <DevTools {user} />
  {/if}
</QueryClientProvider>
