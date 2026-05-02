<script>
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import Empty from '$lib/components/empty.svelte';
  import { Button } from '$lib/components/ui/button';
  import { page } from '$app/state';

  const { status, error } = $derived(page);
</script>

<main class="flex h-full items-center justify-center px-6 py-12">
  <Empty
    variant={status === 404 || status === 499 ? 'warning' : 'destructive'}
    media={{ icon: TriangleAlertIcon, size: 'sm' }}
    class="w-full max-w-xl"
  >
    {#snippet title()}
      {#if status === 499}
        No Active Draft
      {:else if status === 404}
        Dashboard Page Not Found
      {:else}
        Dashboard Error
      {/if}
    {/snippet}
    {#snippet description()}
      {#if status === 499}
        There is no active draft for this view yet.
      {:else if status === 404}
        The dashboard resource you requested does not exist.
      {:else if error === null}
        An unexpected error prevented this dashboard page from loading.
      {:else}
        {status}: {error.message}
      {/if}
    {/snippet}
    <Button href="/dashboard/" variant="outline">Go to Dashboard</Button>
  </Empty>
</main>
