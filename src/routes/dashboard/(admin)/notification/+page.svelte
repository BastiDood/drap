<script lang="ts">
  import Notification from './Notification.svelte';

  const { data } = $props();

  const { notificationRecords } = $derived(data);

  let showDelivered = $state(false);

  const filteredNotificationRecords = $derived(
    (notificationRecords ?? []).filter(({ deliveredAt }) => deliveredAt === null || showDelivered)
  )
</script>

<div class="grid md:grid-cols-2">
  <div class="space-y-3">
    <h4 class="h4">Notifications</h4>
    <p>View and manage dispatched notifications here.</p>
  </div>
  <div class="space-y-3">
    <h4 class="h4">Notifications Log</h4>
    <label class="flex items-center space-x-2">
      <input class="checkbox" type="checkbox" bind:checked={showDelivered} />
      <p>Show Delivered Notifications</p>
    </label>
    {#if typeof notificationRecords === 'undefined'}
      <em>--- No notifications found ---</em>
    {:else}
      <ul class="space-y-1">
        {#each filteredNotificationRecords as { id, data, user, deliveredAt, createdAt } (id)}
          <li
            class="{deliveredAt === null ? "preset-filled-warning-100-900" : "preset-filled-surface-100-900"} hover:{deliveredAt === null ? "preset-filled-warning-200-800" : "preset-filled-surface-200-800"} rounded-md p-2 transition-colors duration-150"
          >
            <Notification {data} {user} {id} {deliveredAt} {createdAt} />
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
