<script>
    import Logo from '$lib/assets/logo-DRAP-icon-colored.svg';
    import { resolve } from '$app/paths';
</script>

<nav class="bg-surface-950/90 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between py-4 px-12 border-b border-surface-700">
  <a href={resolve('/')}>
    <img src={Logo} alt="DRAP Logo" class="size-10" />
  </a>
  <a href={resolve('/dashboard/oauth/login')} class="btn preset-filled-primary-500"> Sign In with UP Mail</a>
</nav>
