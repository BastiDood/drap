<script lang="ts">
  import StudentHub from '$lib/features/student/index.svelte';

  const { data } = $props();
</script>

<StudentHub {...data} />
