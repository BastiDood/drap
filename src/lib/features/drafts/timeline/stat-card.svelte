<script lang="ts">
  import type { LucideIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  import * as Card from '$lib/components/ui/card';

  interface Props {
    title: Snippet;
    body: Snippet;
    subtitle: Snippet;
    icon: LucideIcon;
  }

  const { title, body, subtitle, icon: Icon }: Props = $props();
</script>

<Card.Root variant="soft" class="preset-tonal-muted row-span-3 grid grid-rows-subgrid gap-2 py-4">
  <Card.Header class="flex flex-row items-start justify-between space-y-0 pb-0">
    <Card.Title class="text-sm leading-tight font-medium">{@render title()}</Card.Title>
    <Icon class="size-4 text-muted-foreground" />
  </Card.Header>
  <Card.Content class="pb-0">
    {@render body()}
  </Card.Content>
  <Card.Content class="pt-0">
    <p class="text-xs text-muted-foreground">{@render subtitle()}</p>
  </Card.Content>
</Card.Root>
