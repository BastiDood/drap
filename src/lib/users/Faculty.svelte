<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { UserCircle } from '@steeze-ui/heroicons';
  import type { schema } from '$lib/server/database';

  interface User extends Pick<schema.User, 'email' | 'givenName' | 'familyName' | 'avatarUrl'> {
    labName: string | null;
  }

  interface Props {
    user: User;
  }

  const { user }: Props = $props();
  const { email, givenName, familyName, avatarUrl, labName } = $derived(user);
</script>

<a href="mailto:{email}" class="flex items-center gap-3">
  <Avatar src={avatarUrl} name="{givenName} {familyName}" size="size-14">
    <Icon src={UserCircle} class="size-14" />
  </Avatar>
  <span class="flex flex-col">
    {#if givenName.length > 0 && familyName.length > 0}
      <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
    {/if}
    {#if labName !== null}
      <span class="text-sm opacity-50">{labName}</span>
    {/if}
    <span class="text-xs opacity-50">{email}</span>
  </span>
</a>
