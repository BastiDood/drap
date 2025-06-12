<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { UserCircle } from '@steeze-ui/heroicons';
  import type { schema } from '$lib/server/database';

  interface User extends Pick<schema.User, 'givenName' | 'familyName' | 'email' | 'avatarUrl'> {
    labName: string | null;
  }

  interface Props {
    user: User;
  }

  const { user }: Props = $props();
  const { givenName, familyName, email, avatarUrl, labName } = $derived(user);
</script>

<a href="mailto:{email}" class="flex items-center gap-3">
  <Avatar src={avatarUrl} name="{givenName} {familyName}" size="size-14">
    <Icon src={UserCircle} class="size-14" />
  </Avatar>
  <span class="flex flex-col">
    <strong>{email}</strong>
    {#if labName !== null}
      <span class="text-sm opacity-50">{labName}</span>
    {/if}
  </span>
</a>
