<script lang="ts" module>
  import type { RegisteredAdmin, SenderRole } from '$lib/features/users/types';

  export interface Props {
    user: RegisteredAdmin;
    isSelf: boolean;
    role: SenderRole;
  }
</script>

<script lang="ts">
  import UserCircleIcon from '@lucide/svelte/icons/circle-user';

  import * as Avatar from '$lib/components/ui/avatar';
  import { cn } from '$lib/components/ui/utils';

  import AdminActions from './admin-actions.svelte';
  import RoleBadge from './role-badge.svelte';
  import VolunteerButton from './volunteer-button.svelte';

  const { user, isSelf, role }: Props = $props();
</script>

<div
  class={cn(
    'grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 rounded-lg border-2 border-transparent p-3 transition-colors duration-150 sm:grid-cols-[auto_minmax(0,1fr)_auto]',
    role === 'designated' ? 'border-success/50 bg-success/20 dark:bg-success/5' : 'bg-muted',
  )}
>
  <Avatar.Root class="size-10 shrink-0">
    <Avatar.Image src={user.avatarUrl} alt="{user.givenName} {user.familyName}" />
    <Avatar.Fallback>
      <UserCircleIcon class="size-10" />
    </Avatar.Fallback>
  </Avatar.Root>
  <div class="min-w-0">
    <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      <strong class="truncate"
        ><span class="uppercase">{user.familyName}</span>, {user.givenName}</strong
      >
      <RoleBadge {role} />
    </div>
    <a
      href="mailto:{user.email}"
      class="block truncate text-sm opacity-70 hover:underline hover:opacity-100"
    >
      {user.email}
    </a>
  </div>
  {#if role === 'none'}
    {#if isSelf}
      <div class="col-span-2 justify-self-end sm:col-span-1">
        <VolunteerButton />
      </div>
    {/if}
  {:else}
    <div class="col-span-2 justify-self-end sm:col-span-1">
      <AdminActions userId={user.id} {role} />
    </div>
  {/if}
</div>
