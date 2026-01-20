<script lang="ts">
  import banner from '$lib/banner.png?url';
  import Footer from '$lib/components/footer.svelte';
  import Navbar from '$lib/components/navbar.svelte';
  import { ORIGIN } from '$lib/env';

  import './app.css';

  const { children } = $props();
</script>

<svelte:head>
  <meta property="og:image" content="{ORIGIN}{banner}" />
</svelte:head>

<div class="h-dvh overflow-y-auto">
  <Navbar />
  <div class="px-10 mb-8">
    {@render children?.()}
  </div>
  <Footer />
</div>
