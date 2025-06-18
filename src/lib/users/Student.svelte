<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  import type { schema } from '$lib/server/database';

  interface User
    extends Pick<
      schema.User,
      'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'studentNumber'
    > {
    labs: string[];
    labId: string | null;
  }

  interface Props {
    user: User;
  }

  const { user }: Props = $props();
  const { email, givenName, familyName, avatarUrl, studentNumber, labs, labId } = $derived(user);
</script>

<a
  href="mailto:{email}"
  class="preset-filled-surface-100-900 hover:preset-filled-surface-200-800 grid w-full grid-cols-[auto_1fr] items-center gap-2 rounded-md p-2 transition-colors duration-150"
>
  <Avatar src={avatarUrl} name="{givenName} {familyName}" size="size-20" />
  <span class="flex flex-col">
    {#if givenName.length > 0 && familyName.length > 0}
      <strong><span class="uppercase">{familyName}</span>, {givenName}</strong>
    {/if}
    {#if studentNumber !== null}
      <span class="text-sm opacity-50">{studentNumber}</span>
    {/if}
    <span class="text-xs opacity-50">{email}</span>
    <div class="space-x-1">
      {#if labId === null}
        {#each labs as lab (lab)}
          <span class="preset-tonal-tertiary border-tertiary-500 badge border text-xs uppercase">
            {lab}
          </span>
        {/each}
      {:else}
        <span class="preset-tonal-primary border-primary-500 badge border text-xs uppercase">
          {labId}
        </span>
      {/if}
    </div>
  </span>
</a>
