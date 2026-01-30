<script lang="ts">
  import AdminHub from '$lib/features/admin/index.svelte';

  const { data } = $props();
</script>

<AdminHub user={data.user} />
