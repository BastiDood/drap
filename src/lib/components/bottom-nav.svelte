<script>
  import HouseIcon from '@lucide/svelte/icons/house';
  import MenuIcon from '@lucide/svelte/icons/menu';

  import Logo from '$lib/assets/logo-DRAP-icon-colored.svg';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { TooltipProvider } from '$lib/components/ui/tooltip';

  let { sidebar } = $props();
</script>

<TooltipProvider>
  <nav
    class="flex w-full items-center justify-between gap-2 bg-background/90 px-10 py-2 backdrop-blur-md"
  >
    <div class="flex w-1/3 place-content-center items-center">
      <button
        class="flex w-2/5 place-content-center rounded-lg py-2 active:bg-primary dark:active:bg-white group"
        onclick={_ => {
          sidebar.toggle();
        }}
      >
        <MenuIcon class="size-6 group-active:text-white dark:group-active:text-black" />
        <span class="sr-only">Toggle Sidebar</span>
      </button>
    </div>

    <div class="flex w-1/3 place-content-center items-center">
      <div
        class="flex w-2/5 place-content-center rounded-lg py-2 {String(
          page.url.pathname,
        ).startsWith('/dashboard')
          ? 'bg-primary dark:bg-white'
          : 'bg-transparent'}"
      >
        <a href={resolve('/dashboard')}>
          <HouseIcon
            class="size-6 {String(page.url.pathname).startsWith('/dashboard')
              ? 'text-white dark:text-black'
              : 'text-primary'}"
          />
        </a>
        <span class="sr-only">Go to Dashboard</span>
      </div>
    </div>

    <div class="flex w-1/3 place-content-center items-center">
      <a href={resolve('/')}>
        <img src={Logo} alt="DRAP Logo" class="size-6" />
      </a>
      <span class="sr-only">Go to Home</span>
    </div>
  </nav>
</TooltipProvider>
