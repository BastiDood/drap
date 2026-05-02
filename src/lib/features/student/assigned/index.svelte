<script lang="ts">
  import PartyPopperIcon from '@lucide/svelte/icons/party-popper';

  import Empty from '$lib/components/empty.svelte';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
  import type { schema } from '$lib/server/database/drizzle';

  interface Props {
    lab: Pick<schema.Lab, 'name'>;
  }

  const { lab }: Props = $props();
</script>

<Empty media={{ icon: PartyPopperIcon, size: 'md' }}>
  {#snippet title()}Congratulations!{/snippet}
  {#snippet description()}
    You have been assigned to <strong>{lab.name}</strong>. Welcome to your new research lab!
  {/snippet}
  <Button href={resolve('/dashboard/lab/')}>View Your Lab</Button>
</Empty>
