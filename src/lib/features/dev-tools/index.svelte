<script lang="ts">
  import BugIcon from '@lucide/svelte/icons/bug';

  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Button } from '$lib/components/ui/button';
  import type { schema } from '$lib/server/database';

  import RoleSwitcherDialog from './role-switcher/dialog.svelte';

  interface Props {
    user: schema.User;
  }

  const { user }: Props = $props();

  let roleDialogOpen = $state(false);
</script>

<div class="fixed right-4 bottom-4 z-50">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button {...props} variant="outline" size="icon-lg">
          <BugIcon class="size-4" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <DropdownMenu.Item onclick={() => (roleDialogOpen = true)}>Change Role</DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
<RoleSwitcherDialog {user} bind:open={roleDialogOpen} />
