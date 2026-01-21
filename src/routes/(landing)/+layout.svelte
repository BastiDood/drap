<script>
  import Footer from '$lib/components/footer.svelte';
  import Navbar from '$lib/components/navbar.svelte';

  const { children } = $props();
</script>

<div class="h-dvh overflow-y-auto">
  <Navbar />
  {@render children?.()}
  <Footer />
</div>
