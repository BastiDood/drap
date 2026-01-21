<script lang="ts">
  import { ModeWatcher } from 'mode-watcher';

  import banner from '$lib/banner.png?url';
  import { ORIGIN } from '$lib/env';

  import './app.css';

  const { children } = $props();
</script>

<ModeWatcher />

<svelte:head>
  <meta property="og:image" content="{ORIGIN}{banner}" />
</svelte:head>

{@render children?.()}
