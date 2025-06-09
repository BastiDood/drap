<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { UserCircle } from '@steeze-ui/heroicons';
  import type { schema } from '$lib/server/database';

  type Props = Pick<schema.User, 'email' | 'givenName' | 'familyName' | 'avatarUrl'>;

  // eslint-disable-next-line @typescript-eslint/init-declarations
  export let user: Props;
  $: ({ email, givenName, familyName, avatarUrl } = user);
</script>

<a href="mailto:{email}">
  <Avatar src={avatarUrl} width="w-14"><Icon src={UserCircle} class="w-14" /></Avatar>
  <span class="flex flex-col">
    {#if givenName.length > 0 && familyName.length > 0}
      <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
    {/if}
    <span class="text-xs opacity-50">{email}</span>
  </span>
</a>
