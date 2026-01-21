<script>
  import Logo from '$lib/assets/logo-DRAP-icon-colored.svg';
  import ModeSwitcher from '$lib/components/mode-switcher.svelte';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
  import { TooltipProvider } from '$lib/components/ui/tooltip';
</script>

<TooltipProvider>
  <nav
    class="border-border bg-background/90 sticky top-0 z-50 flex items-center justify-between border-b px-12 py-4 backdrop-blur-md"
  >
    <a href={resolve('/')}>
      <img src={Logo} alt="DRAP Logo" class="size-10" />
    </a>
    <div class="flex items-center gap-2">
      <ModeSwitcher />
      <Button href={resolve('/dashboard/')}>Sign in with UP Mail</Button>
    </div>
  </nav>
</TooltipProvider>
