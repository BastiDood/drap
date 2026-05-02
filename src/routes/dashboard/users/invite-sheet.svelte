<script lang="ts">
  import Loader2Icon from '@lucide/svelte/icons/loader-2';
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Sheet from '$lib/components/ui/sheet';
  import Empty from '$lib/components/empty.svelte';
  import Invited from '$lib/users/invited.svelte';
  import { Button } from '$lib/components/ui/button';
  import { createFetchInvitedUsersQuery } from '$lib/queries/fetch-invited-users';
  import type { schema } from '$lib/server/database/drizzle';

  import AdminForm from './admin-form.svelte';
  import FacultyForm from './faculty-form.svelte';

  type Lab = Pick<schema.Lab, 'id' | 'name'>;

  interface Props {
    labs?: Lab[];
  }

  const { labs }: Props = $props();

  const isLabHeadMode = $derived(typeof labs !== 'undefined');
  const inviteType = $derived(isLabHeadMode ? 'heads' : 'admins');
  const query = $derived(createFetchInvitedUsersQuery(inviteType));
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" size="sm" {...props}>
        <UsersIcon class="mr-2 size-4" />
        <span>Manage Invitations</span>
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-md">
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>
        {#if typeof labs === 'undefined'}
          Invite Draft Administrators
        {:else}
          Invite Lab Heads
        {/if}
      </Sheet.Title>
      <Sheet.Description>Invite new users or view pending invitations.</Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col gap-6">
      <div class="shrink-0">
        {#if typeof labs === 'undefined'}
          <AdminForm />
        {:else}
          <FacultyForm {labs} />
        {/if}
      </div>
      <div class="flex min-h-0 grow flex-col gap-4 overflow-y-auto">
        {#if query.isPending}
          <Empty media={{ icon: Loader2Icon, size: 'sm', iconClass: 'animate-spin' }}>
            {#snippet title()}Loading Invitations{/snippet}
            {#snippet description()}Fetching pending invitations...{/snippet}
          </Empty>
        {:else if query.isError}
          <Empty variant="destructive" media={{ icon: UsersIcon, size: 'sm' }}>
            {#snippet title()}Failed to Load Invitations{/snippet}
            {#snippet description()}Please try again in a moment.{/snippet}
          </Empty>
        {:else if query.data.length === 0}
          <Empty media={{ icon: UsersIcon, size: 'sm' }}>
            {#snippet title()}No Pending Invitations{/snippet}
            {#snippet description()}New invitations will appear here after they are sent.{/snippet}
          </Empty>
        {:else}
          {#each query.data as user (user.id)}
            <Invited {user} />
          {/each}
        {/if}
      </div>
    </div>
  </Sheet.Content>
</Sheet.Root>
