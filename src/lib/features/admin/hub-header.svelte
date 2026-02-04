<script lang="ts">
  import PencilIcon from '@lucide/svelte/icons/pencil';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Sheet from '$lib/components/ui/sheet';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import type { schema } from '$lib/server/database/drizzle';

  import ProfileForm from './profile-form.svelte';

  interface User extends Pick<schema.User, 'givenName' | 'familyName' | 'email' | 'avatarUrl'> {
    labId: string | null;
  }

  interface Props {
    user: User;
  }

  const { user }: Props = $props();

  let sheetOpen = $state(false);

  function handleSuccess() {
    sheetOpen = false;
  }

  const roleLabel = $derived(user.labId === null ? 'Admin' : 'Faculty');
</script>

<Sheet.Root bind:open={sheetOpen}>
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-4">
      <Avatar.Root class="size-16">
        <Avatar.Image src={user.avatarUrl} alt="{user.givenName} {user.familyName}" />
        <Avatar.Fallback class="text-lg">{user.givenName[0]}{user.familyName[0]}</Avatar.Fallback>
      </Avatar.Root>
      <div>
        <h1 class="text-2xl font-semibold">{user.givenName} {user.familyName}</h1>
        <div class="text-muted-foreground flex items-center gap-2 text-sm">
          <span>{user.email}</span>
          <Badge variant="secondary">{roleLabel}</Badge>
        </div>
      </div>
    </div>
    <Sheet.Trigger>
      {#snippet child({ props })}
        <Button variant="outline" size="sm" {...props}>
          <PencilIcon class="mr-2 size-4" />
          Edit Profile
        </Button>
      {/snippet}
    </Sheet.Trigger>
  </div>
  <Sheet.Content side="right" class="p-6">
    <Sheet.Header>
      <Sheet.Title>Edit Profile</Sheet.Title>
      <Sheet.Description>Update your name and personal information.</Sheet.Description>
    </Sheet.Header>
    <div class="py-4">
      <ProfileForm {user} onSuccess={handleSuccess} />
    </div>
  </Sheet.Content>
</Sheet.Root>
