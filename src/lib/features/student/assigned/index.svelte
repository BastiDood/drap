<script lang="ts">
  import PartyPopperIcon from '@lucide/svelte/icons/party-popper';

  import * as Empty from '$lib/components/ui/empty';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
  import type { schema } from '$lib/server/database';

  interface Props {
    lab: Pick<schema.Lab, 'name'>;
  }

  const { lab }: Props = $props();
</script>

<Empty.Root>
  <Empty.Media>
    <PartyPopperIcon class="text-muted-foreground size-12" />
  </Empty.Media>
  <Empty.Header>
    <Empty.Title>Congratulations!</Empty.Title>
    <Empty.Description>
      You have been assigned to <strong>{lab.name}</strong>. Welcome to your new research lab!
    </Empty.Description>
  </Empty.Header>
  <Empty.Content>
    <Button href={resolve('/dashboard/lab/')}>View Your Lab</Button>
  </Empty.Content>
</Empty.Root>
