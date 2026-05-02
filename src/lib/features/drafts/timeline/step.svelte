<script lang="ts" module>
  export type Status = 'completed' | 'active' | 'pending';
</script>

<script lang="ts">
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import type { Snippet } from 'svelte';

  import * as Collapsible from '$lib/components/ui/collapsible';
  import { cn } from '$lib/components/ui/utils';

  interface Props {
    title: string;
    status: Status;
    last?: boolean;
    collapsible?: boolean;
    flush?: boolean;
    open?: boolean;
    children: Snippet;
    metadata?: Snippet;
  }

  let {
    title,
    status,
    last = false,
    collapsible = true,
    flush = false,
    open = $bindable(false),
    children,
    metadata,
  }: Props = $props();
</script>

<div class="relative flex gap-4">
  <!-- Connector Line -->
  {#if !last}
    <div class="absolute top-8 -bottom-2 left-3 w-px bg-border"></div>
  {/if}

  <!-- Status Icon -->
  <div
    class="relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-background"
  >
    {#if status === 'completed'}
      <CheckCircleIcon class="size-5 text-success" />
    {:else if status === 'active'}
      <div class="flex size-5 items-center justify-center rounded-full border-2 border-primary">
        <div class="size-1.5 rounded-full bg-primary"></div>
      </div>
    {:else}
      <CircleIcon class="size-5 text-muted-foreground/50" />
    {/if}
  </div>

  <!-- Content Area -->
  <div class="min-w-0 grow pb-6">
    {#if collapsible}
      <Collapsible.Root bind:open>
        <Collapsible.Trigger
          class="-ml-2 flex w-full items-center justify-between rounded-lg px-2 py-1 hover:bg-muted/50"
        >
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 py-1">
            <h3 class="font-semibold">{title}</h3>
            {#if metadata}
              {@render metadata()}
            {/if}
          </div>
          <ChevronDownIcon
            class={cn('size-4 rotate-0 text-muted-foreground transition-transform duration-300', {
              'rotate-180': open,
            })}
          />
        </Collapsible.Trigger>
        <Collapsible.Content>
          {#if flush}
            {@render children()}
          {:else}
            <div class="rounded-lg bg-background p-4">
              {@render children()}
            </div>
          {/if}
        </Collapsible.Content>
      </Collapsible.Root>
    {:else}
      <!-- Non-Collapsible (Summary) -->
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 py-1">
        <h3 class="font-semibold">{title}</h3>
        {@render metadata?.()}
      </div>
      {#if flush}
        {@render children()}
      {:else}
        <div class="rounded-lg bg-background p-4">
          {@render children()}
        </div>
      {/if}
    {/if}
  </div>
</div>
