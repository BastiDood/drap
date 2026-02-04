<script lang="ts">
  import BugIcon from '@lucide/svelte/icons/bug';
  import SendIcon from '@lucide/svelte/icons/send';
  import UserCogIcon from '@lucide/svelte/icons/user-cog';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';

  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Button } from '$lib/components/ui/button';
  import type { schema } from '$lib/server/database/drizzle';

  import DummyUserDialog from './dummy-user-creator/dialog.svelte';
  import EmailDispatcherDialog from './email-dispatcher/dialog.svelte';
  import RoleSwitcherDialog from './role-switcher/dialog.svelte';

  interface Props {
    user: schema.User;
  }

  const { user }: Props = $props();

  let dummyUserDialogOpen = $state(false);
  let emailDialogOpen = $state(false);
  let roleDialogOpen = $state(false);
</script>

<div class="fixed right-4 bottom-4 z-50">
  <DropdownMenu.Root>
    <DropdownMenu.Trigger>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="outline"
          size="icon-lg"
          class="bg-background hover:bg-accent dark:bg-input dark:hover:bg-input/80"
        >
          <BugIcon class="size-4" />
        </Button>
      {/snippet}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end">
      <DropdownMenu.Item onclick={() => (dummyUserDialogOpen = true)}>
        <UserPlusIcon class="size-4 text-current" />
        <span>Create User</span>
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={() => (roleDialogOpen = true)}>
        <UserCogIcon class="size-4 text-current" />
        <span>Change Role</span>
      </DropdownMenu.Item>
      <DropdownMenu.Item onclick={() => (emailDialogOpen = true)}>
        <SendIcon class="size-4 text-current" />
        <span>Dispatch Email</span>
      </DropdownMenu.Item>
    </DropdownMenu.Content>
  </DropdownMenu.Root>
</div>
<DummyUserDialog bind:open={dummyUserDialogOpen} />
<EmailDispatcherDialog bind:open={emailDialogOpen} />
<RoleSwitcherDialog {user} bind:open={roleDialogOpen} />
