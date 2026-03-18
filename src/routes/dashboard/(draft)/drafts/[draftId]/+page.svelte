<script lang="ts">
  import { DraftTimeline } from '$lib/features/drafts';

  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';

  const { data } = $props();

  // Make new TanStack query client
  const queryClient = new QueryClient();
</script>

<QueryClientProvider client={queryClient}>
  <DraftTimeline {...data} />
</QueryClientProvider>
