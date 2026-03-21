<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
  import type { schema } from '$lib/server/database/drizzle';

  import DesignatedLab from './designated-lab.svelte';
  import PreferredLab from './preferred-lab.svelte';

  interface User extends Pick<
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
  class="grid w-full grid-cols-[auto_1fr] items-center gap-2 rounded-md bg-muted p-2 transition-colors duration-150 hover:bg-muted/80"
>
  <Avatar.Root class="size-20">
    <Avatar.Image src={avatarUrl} alt="{givenName} {familyName}" />
    <Avatar.Fallback>{givenName[0]}{familyName[0]}</Avatar.Fallback>
  </Avatar.Root>
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
        <PreferredLab {labs} />
      {:else}
        <DesignatedLab {labId} />
      {/if}
    </div>
  </span>
</a>
