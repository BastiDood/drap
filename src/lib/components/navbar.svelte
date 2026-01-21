<script>
  import Logo from '$lib/assets/logo-DRAP-icon-colored.svg';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
</script>

<nav
  class="border-border bg-background/90 sticky top-0 z-50 flex items-center justify-between border-b px-12 py-4 backdrop-blur-md"
>
  <a href={resolve('/')}>
    <img src={Logo} alt="DRAP Logo" class="size-10" />
  </a>
  <Button href={resolve('/dashboard/oauth/login')}>Sign in with UP Mail</Button>
</nav>
