<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { UserCircle } from '@steeze-ui/heroicons';

  import type { schema } from '$lib/server/database';

  type User = Pick<schema.User, 'email' | 'givenName' | 'familyName' | 'avatarUrl'>;
  interface Props {
    user: User;
  }

  const { user }: Props = $props();
  const { email, givenName, familyName, avatarUrl } = $derived(user);
</script>

<a href="mailto:{email}" class="flex items-center gap-3">
  <Avatar src={avatarUrl} name="{givenName} {familyName}" size="size-14">
    <Icon src={UserCircle} class="size-14" />
  </Avatar>
  <span class="flex flex-col">
    {#if givenName.length > 0 && familyName.length > 0}
      <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
    {/if}
    <span class="text-xs opacity-50">{email}</span>
  </span>
</a>
