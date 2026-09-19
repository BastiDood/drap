<script>
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { useSidebar } from '$lib/components/ui/sidebar';
  import { cn } from '$lib/components/ui/utils';
  import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
  import HomeIcon from '@lucide/svelte/icons/home';
  import MenuIcon from '@lucide/svelte/icons/menu';

  const sidebar = useSidebar();
</script>

<menu
  class="flex w-full items-center justify-between gap-2 border-t border-border bg-background/90 px-10 py-2 backdrop-blur-md md:hidden"
>
  <li class="flex size-12 place-content-center items-center">
    <button
      class="flex place-content-center rounded-lg p-3 active:bg-sidebar-accent active:text-sidebar-accent-foreground"
      onclick={sidebar.toggle.bind(sidebar)}
    >
      <MenuIcon size={24} />
      <span class="sr-only">Toggle Sidebar</span>
    </button>
  </li>
  <li class="flex size-12 place-content-center items-center">
    <div
      class={cn(
        'flex place-content-center rounded-lg p-3',
        page.url.pathname.startsWith('/dashboard')
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-foreground',
      )}
    >
      <a href={resolve('/dashboard/')}>
        <FlaskConicalIcon size={24} />
        <span class="sr-only">Go to Dashboard</span>
      </a>
    </div>
  </li>
  <li class="flex size-12 place-content-center items-center">
    <a
      href={resolve('/')}
      class="flex place-content-center rounded-lg p-3 active:bg-sidebar-accent active:text-sidebar-accent-foreground"
    >
      <HomeIcon size={24} />
      <span class="sr-only">Go to Home</span>
    </a>
  </li>
</menu>
