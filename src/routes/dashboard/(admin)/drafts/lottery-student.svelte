<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
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
  <Avatar.Root class="size-20">
    <Avatar.Image src={avatarUrl} alt="{givenName} {familyName}" />
    <Avatar.Fallback>{givenName[0]}{familyName[0]}</Avatar.Fallback>
  </Avatar.Root>
</span>
<span class="flex w-full flex-col">
  <strong class="text-sm"><span class="uppercase">{familyName}</span>, {givenName}</strong>
  {#if studentNumber !== null}
    <span class="text-xs opacity-50">{studentNumber}</span>
  {/if}
  <span class="text-xs opacity-50">{email}</span>
  <select name={id} class="border-input bg-background w-full rounded-md border px-2 py-1 text-xs">
    <option value="" selected>[Undrafted]</option>
    {#each labs as { id, name } (id)}
      <option value={id}>{name}</option>
    {/each}
  </select>
</span>
