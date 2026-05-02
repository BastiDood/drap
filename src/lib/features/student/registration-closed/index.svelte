<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import { format } from 'date-fns';

  import Empty from '$lib/components/empty.svelte';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';

  interface Props {
    registrationClosedAt: Date;
  }

  const { registrationClosedAt }: Props = $props();

  const closeDate = $derived(format(registrationClosedAt, 'PPP'));
  const closeTime = $derived(format(registrationClosedAt, 'pp'));
</script>

<Empty media={{ icon: LockIcon, size: 'md' }}>
  {#snippet title()}Registration Closed{/snippet}
  {#snippet description()}
    Registration for this draft closed on <strong>{closeDate}</strong> at
    <strong>{closeTime}</strong>. You were not registered in time to participate in this draft.
  {/snippet}
  <Button href={resolve('/history/')}>View Draft History</Button>
</Empty>
