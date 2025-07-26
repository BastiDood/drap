<script lang="ts">
  import type { Notification } from '$lib/server/models/notification';

  interface Props {
    notification: Notification;
  }

  const { notification }: Props = $props();
</script>

<h4>
{#if notification.target === "Draft"}
    Draft
{:else}
    Student
{/if}
    Notification
</h4>