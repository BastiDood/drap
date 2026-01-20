<script>
  import Logo from '$lib/assets/logo-DRAP-icon-colored.svg';
  import { resolve } from '$app/paths';
</script>

<nav
  class="bg-surface-950/90 border-surface-700 sticky top-0 z-50 flex items-center justify-between border-b px-12 py-4 backdrop-blur-md"
>
  <a href={resolve('/')}>
    <img src={Logo} alt="DRAP Logo" class="size-10" />
  </a>
  <a href={resolve('/dashboard/oauth/login')} class="btn preset-filled-primary-500">
    Sign In with UP Mail</a
  >
</nav>
