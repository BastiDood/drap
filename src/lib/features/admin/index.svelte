<script lang="ts">
  import type { schema } from '$lib/server/database/drizzle';

  import HubHeader from './hub-header.svelte';

  interface Props {
    user: Pick<schema.User, 'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl' | 'labId'>;
  }

  const { user }: Props = $props();
</script>

<div class="size-full space-y-6">
  <HubHeader {user} />
  <hr class="border-border" />
  <div class="text-muted-foreground">
    {#if user.labId === null}
      <p>
        Welcome to the admin dashboard. Use the sidebar to manage labs, users, drafts, and email
        settings.
      </p>
    {:else}
      <p>Welcome to the faculty dashboard. Use the sidebar to manage your lab and view students.</p>
    {/if}
  </div>
</div>
