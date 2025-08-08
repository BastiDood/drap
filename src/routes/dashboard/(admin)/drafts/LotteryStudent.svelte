<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';

  import type { schema } from '$lib/server/database';

  type Lab = Pick<schema.Lab, 'id' | 'name'>;
  type User = Pick<
    schema.User,
    'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
  >;

  interface Props {
    labs: Lab[];
    user: User;
  }

  const { labs, user }: Props = $props();
  const { id, email, givenName, familyName, avatarUrl, studentNumber } = $derived(user);
</script>

<span>
  <Avatar src={avatarUrl} name="{givenName} {familyName}" size="size-20" />
</span>
<span class="flex w-full flex-col">
  <strong class="text-sm"><span class="uppercase">{familyName}</span>, {givenName}</strong>
  {#if studentNumber !== null}
    <span class="text-xs opacity-50">{studentNumber}</span>
  {/if}
  <span class="text-xs opacity-50">{email}</span>
  <select name={id} class="select w-full text-xs">
    <option value="" selected>[Undrafted]</option>
    {#each labs as { id, name } (id)}
      <option value={id}>{name}</option>
    {/each}
  </select>
</span>
