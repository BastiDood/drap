<script lang="ts">
  import type { Notification as NotificationType } from "$lib/server/models/notification";
  import Notification from "./Notification.svelte";

  const { data } = $props();

  const { notificationRecords } = $derived(data);
  const notifications: NotificationType[] = $derived(notificationRecords?.map(({ data }) => data) ?? []);
</script>

<div class="grid md:grid-cols-2">
  <div>
    <h4 class="h4">Notifications</h4>
    <p>View and manage dispatched notifications here.</p>
  </div>
  <div>
    <h4 class="h4">Notifications Log</h4>
    {#each notifications as notification}
      <Notification {notification} />
    {/each}
  </div>
</div>
