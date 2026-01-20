<script lang="ts">
  import banner from '$lib/banner.png?url';
  import Footer from '$lib/components/footer.svelte';
  import Hero from '$lib/components/hero.svelte';
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
  <Hero />
  <div class="mb-8 px-10 lg:px-56">
    {@render children?.()}
  </div>
  <Footer />
</div>
