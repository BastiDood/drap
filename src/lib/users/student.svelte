<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
  import { Badge } from '$lib/components/ui/badge';
  import type { schema } from '$lib/server/database';

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
  class="bg-muted hover:bg-muted/80 grid w-full grid-cols-[auto_1fr] items-center gap-2 rounded-md p-2 transition-colors duration-150"
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
        {#each labs as lab (lab)}
          <Badge variant="outline" class="border-accent bg-accent/10 text-xs uppercase">
            {lab}
          </Badge>
        {/each}
      {:else}
        <Badge variant="outline" class="border-primary bg-primary/10 text-xs uppercase">
          {labId}
        </Badge>
      {/if}
    </div>
  </span>
</a>
