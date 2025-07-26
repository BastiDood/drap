<script lang="ts">
  import Notification from './Notification.svelte';

  const { data } = $props();

  const { notificationRecords } = $derived(data);
</script>

<div class="grid md:grid-cols-2">
  <div>
    <h4 class="h4">Notifications</h4>
    <p>View and manage dispatched notifications here.</p>
  </div>
  <div>
    <h4 class="h4">Notifications Log</h4>
    {#if typeof notificationRecords === 'undefined'}
      <em>--- No notifications found ---</em>
    {:else}
      <ul class="space-y-2">
        {#each notificationRecords as { id, data, user, deliveredAt, createdAt } (id)}
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
