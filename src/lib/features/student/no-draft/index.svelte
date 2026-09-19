<script lang="ts">
  import { resolve } from '$app/paths';
  import Empty from '$lib/components/empty.svelte';
  import { Button } from '$lib/components/ui/button';
  import CalendarIcon from '@lucide/svelte/icons/calendar';
</script>

<Empty media={{ icon: CalendarIcon, size: 'md' }}>
  {#snippet title()}No Active Draft{/snippet}
  {#snippet description()}
    There's no draft currently open for registration. Check back later when the next draft period
    begins.
  {/snippet}
  <Button href={resolve('/history/')}>View Draft History</Button>
</Empty>
