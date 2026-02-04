<script lang="ts">
  import UserCircleIcon from '@lucide/svelte/icons/circle-user';

  import * as Avatar from '$lib/components/ui/avatar';
  import type { schema } from '$lib/server/database/drizzle';

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
  <Avatar.Root class="size-14">
    <Avatar.Image src={avatarUrl} alt="{givenName} {familyName}" />
    <Avatar.Fallback>
      <UserCircleIcon class="size-14" />
    </Avatar.Fallback>
  </Avatar.Root>
  <span class="flex flex-col">
    <strong>{email}</strong>
    {#if labName !== null}
      <span class="text-sm opacity-50">{labName}</span>
    {/if}
  </span>
</a>
