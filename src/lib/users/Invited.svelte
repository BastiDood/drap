<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { UserCircle } from '@steeze-ui/heroicons';
  import type { schema } from '$lib/server/database';

  interface Props extends Pick<schema.User, 'email' | 'avatarUrl'> {
    labName: string | null;
  }

  // eslint-disable-next-line @typescript-eslint/init-declarations
  export let user: Props;
  $: ({ email, avatarUrl, labName } = user);
</script>

<a href="mailto:{email}">
  <span><Avatar src={avatarUrl} width="w-14"><Icon src={UserCircle} class="w-14" /></Avatar></span>
  <span class="flex flex-col">
    <strong>{email}</strong>
    {#if labName !== null}
      <span class="text-sm opacity-50">{labName}</span>
    {/if}
  </span>
</a>
