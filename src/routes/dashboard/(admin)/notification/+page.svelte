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
      <div class="space-y-2">
        {#each notificationRecords as { id, data, user, deliveredAt, createdAt } (id)}
          <Notification {data} {user} {id} {deliveredAt} {createdAt} />
        {/each}
      </div>
    {/if}
  </div>
</div>
