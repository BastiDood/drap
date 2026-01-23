<script lang="ts">
  import CalendarIcon from '@lucide/svelte/icons/calendar';

  import * as Empty from '$lib/components/ui/empty';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
</script>

<Empty.Root>
  <Empty.Media>
    <CalendarIcon class="text-muted-foreground size-12" />
  </Empty.Media>
  <Empty.Header>
    <Empty.Title>No Active Draft</Empty.Title>
    <Empty.Description>
      There's no draft currently open for registration. Check back later when the next draft period
      begins.
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <Button href={resolve('/history/')}>View Draft History</Button>
  </Empty.Content>
</Empty.Root>
