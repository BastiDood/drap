<script lang="ts">
  import UserlistItem from '$lib/components/userlist-item.svelte';
  import type { schema } from '$lib/server/database/drizzle';

  type User = Pick<schema.User, 'email' | 'givenName' | 'familyName' | 'avatarUrl'>;
  interface Props {
    user: User;
  }

  const { user }: Props = $props();
  const { email, givenName, familyName, avatarUrl } = $derived(user);
</script>

<UserlistItem {email} {givenName} {familyName} avatar={{ variant: 'profile', url: avatarUrl }} />
