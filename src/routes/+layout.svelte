<script lang="ts">
  import banner from '$lib/banner.png?url';
  import { ORIGIN } from '$lib/env';

  import './app.css';

  const { children } = $props();
</script>

<svelte:head>
  <meta property="og:image" content="{ORIGIN}{banner}" />
</svelte:head>

<div class="h-dvh overflow-y-auto p-4">{@render children?.()}</div>
