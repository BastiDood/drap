<script lang="ts">
  import type { User } from '$lib/server/database/schema';
  import type { Notification } from '$lib/server/models/notification';

  export type TargetUser = Pick<User, 'email' | 'avatarUrl' | 'givenName' | 'familyName'>;

  interface Props {
    data: Notification;
    user: TargetUser | null;
    id: string;
  }

  const { data, user, id }: Props = $props();
</script>

<div>
    <h5 class="h5">
    {#if data.target === "Draft"}
        Draft
    {:else}
        Student
    {/if}
        Notification
    </h5>
    {#if data.target === "Draft"}
        
    {/if}
</div>