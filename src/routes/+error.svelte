<script>
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import Empty from '$lib/components/empty.svelte';
  import { Button } from '$lib/components/ui/button';
  import { page } from '$app/state';

  const { status, error } = $derived(page);
</script>

<main class="flex min-h-dvh items-center justify-center px-6 py-12">
  <Empty
    variant={status === 404 ? 'warning' : 'destructive'}
    media={{ icon: TriangleAlertIcon, size: 'sm' }}
    class="w-full max-w-xl"
  >
    {#snippet title()}
      {#if status === 404}
        Page Not Found
      {:else}
        Something Went Wrong
      {/if}
    {/snippet}
    {#snippet description()}
      {#if status === 404}
        The page you requested does not exist or is no longer available.
      {:else if error === null}
        An unexpected error prevented this page from loading.
      {:else}
        {status}: {error.message}
      {/if}
    {/snippet}
    <Button href="/" variant="outline">Go home</Button>
  </Empty>
</main>
