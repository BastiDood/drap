<script>
  import MonitorIcon from '@lucide/svelte/icons/monitor';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import SunIcon from '@lucide/svelte/icons/sun';
  import { setMode, userPrefersMode } from 'mode-watcher';

  import { buttonVariants } from '$lib/components/ui/button';
  import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';

  function nextMode() {
    switch (userPrefersMode.current) {
      case 'light':
        return 'dark';
      case 'dark':
        return 'system';
      case 'system':
        return 'light';
      default:
        return 'system';
    }
  }

  function getModeLabel() {
    switch (userPrefersMode.current) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
      default:
        return 'System';
    }
  }

  const modeLabel = $derived(getModeLabel());
</script>

<Tooltip>
  <TooltipTrigger>
    {#snippet child({ props })}
      <button
        {...props}
        class={buttonVariants({ variant: 'ghost', size: 'icon' })}
        aria-label="Toggle theme"
        onclick={() => setMode(nextMode())}
      >
        {#if userPrefersMode.current === 'light'}
          <SunIcon class="size-5" />
        {:else if userPrefersMode.current === 'dark'}
          <MoonIcon class="size-5" />
        {:else}
          <MonitorIcon class="size-5" />
        {/if}
      </button>
    {/snippet}
  </TooltipTrigger>
  <TooltipContent>Theme: {modeLabel}</TooltipContent>
</Tooltip>
