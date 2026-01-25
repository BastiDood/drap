<script lang="ts" module>
  export type Status = 'completed' | 'active' | 'pending';
</script>

<script lang="ts">
  import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import CircleIcon from '@lucide/svelte/icons/circle';
  import type { Snippet } from 'svelte';

  import { tv } from 'tailwind-variants';

  import * as Collapsible from '$lib/components/ui/collapsible';

  interface Props {
    title: string;
    status: Status;
    last?: boolean;
    collapsible?: boolean;
    defaultOpen?: boolean;
    children: Snippet;
    metadata?: Snippet;
  }

  const {
    title,
    status,
    last = false,
    collapsible = true,
    defaultOpen = false,
    children,
    metadata,
  }: Props = $props();

  let open = $derived(defaultOpen);

  const contentVariants = tv({
    base: 'mt-3 rounded-lg p-4',
    variants: {
      status: {
        completed: 'bg-card',
        active: 'bg-card',
        pending: '',
      },
    },
  });
</script>

<div class="relative flex gap-4">
  <!-- Connector line -->
  {#if !last}
    <div class="bg-border absolute top-8 -bottom-2 left-3 w-px"></div>
  {/if}

  <!-- Status icon -->
  <div
    class="bg-background relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full"
  >
    {#if status === 'completed'}
      <CheckCircleIcon class="text-success size-5" />
    {:else if status === 'active'}
      <CircleIcon class="fill-primary text-primary size-5" />
    {:else}
      <CircleIcon class="text-muted-foreground/50 size-5" />
    {/if}
  </div>

  <!-- Content area -->
  <div class="flex-1 pb-6">
    {#if collapsible}
      <Collapsible.Root bind:open>
        <Collapsible.Trigger
          class="hover:bg-muted/50 -ml-2 flex w-full items-center justify-between rounded-lg px-2 py-1"
        >
          <div class="flex items-center gap-3">
            <h3 class="font-semibold">{title}</h3>
            {#if metadata}
              {@render metadata()}
            {/if}
          </div>
          <ChevronDownIcon
            class="text-muted-foreground size-4 transition-transform {open ? 'rotate-180' : ''}"
          />
        </Collapsible.Trigger>
        <Collapsible.Content>
          <div class={contentVariants({ status })}>
            {@render children()}
          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    {:else}
      <!-- Non-collapsible (summary) -->
      <div class="flex items-center gap-3 py-1">
        <h3 class="font-semibold">{title}</h3>
        {#if metadata}
          {@render metadata()}
        {/if}
      </div>
      <div class={contentVariants({ status })}>
        {@render children()}
      </div>
    {/if}
  </div>
</div>
