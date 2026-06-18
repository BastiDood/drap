<script lang="ts" module>
  import type { RegisteredAdmin, SenderRole } from '$lib/features/users/types';

  export interface Props {
    user: RegisteredAdmin;
    isSelf: boolean;
    role: SenderRole;
  }
</script>

<script lang="ts">
  import UserlistItem from '$lib/components/userlist-item.svelte';
  import { cn } from '$lib/components/ui/utils';

  import AdminActions from './admin-actions.svelte';
  import RoleBadge from './role-badge.svelte';
  import VolunteerButton from './volunteer-button.svelte';

  const { user, isSelf, role }: Props = $props();
  const hasActions = $derived(role !== 'none' || isSelf);
  const hasBadges = $derived(role !== 'none');
  const className = $derived(
    cn(
      'border-2 border-transparent p-3 transition-colors duration-150',
      role === 'designated' ? 'border-success/50 bg-success/20 dark:bg-success/5' : 'bg-muted',
    ),
  );
</script>

{#snippet actionButtons()}
  {#if role === 'none'}
    <VolunteerButton />
  {:else}
    <AdminActions userId={user.id} {role} />
  {/if}
{/snippet}

{#snippet badges()}
  <RoleBadge {role} />
{/snippet}

<UserlistItem
  email={user.email}
  familyName={user.familyName}
  givenName={user.givenName}
  avatar={{
    variant: 'profile',
    url: user.avatarUrl,
    alt: `${user.givenName} ${user.familyName}`,
  }}
  class={className}
  badges={hasBadges ? badges : null}
  actionButtons={hasActions ? actionButtons : null}
/>
