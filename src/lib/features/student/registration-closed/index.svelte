<script lang="ts">
  import LockIcon from '@lucide/svelte/icons/lock';
  import { format } from 'date-fns';

  import * as Empty from '$lib/components/ui/empty';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';

  interface Props {
    registrationClosesAt: Date;
  }

  const { registrationClosesAt }: Props = $props();

  const closeDate = $derived(format(registrationClosesAt, 'PPP'));
  const closeTime = $derived(format(registrationClosesAt, 'pp'));
</script>

<Empty.Root>
  <Empty.Media>
    <LockIcon class="text-muted-foreground size-12" />
  </Empty.Media>
  <Empty.Header>
    <Empty.Title>Registration Closed</Empty.Title>
    <Empty.Description>
      Registration for this draft closed on <strong>{closeDate}</strong> at
      <strong>{closeTime}</strong>. You were not registered in time to participate in this draft.
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <Button href={resolve('/history/')}>View Draft History</Button>
  </Empty.Content>
</Empty.Root>
