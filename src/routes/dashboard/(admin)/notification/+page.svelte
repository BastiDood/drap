<script lang="ts">
  import Notification from './Notification.svelte';

  const { data } = $props();

  const { notificationRecords } = $derived(data);
  const notifications = $derived(
    notificationRecords?.map(({ id, data, user }) => ({ id, data, user })) ?? [],
  );
</script>

<div class="grid md:grid-cols-2">
  <div>
    <h4 class="h4">Notifications</h4>
    <p>View and manage dispatched notifications here.</p>
  </div>
  <div>
    <h4 class="h4">Notifications Log</h4>
    {#each notifications as { id, data, user } (id)}
      <Notification {data} {user} {id} />
    {/each}
  </div>
</div>
