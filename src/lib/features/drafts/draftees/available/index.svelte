<script lang="ts">
  import { tv } from 'tailwind-variants';

  import * as Drawer from '$lib/components/ui/drawer';
  import { Button } from '$lib/components/ui/button';

  import Loader, { type Props as LoaderProps } from './loader.svelte';

  const triggerVariants = tv({
    variants: {
      variant: {
        'pending-selection': 'border-warning text-warning',
        'see-preferred': 'border-accent bg-accent/10 h-fit font-mono text-xs uppercase',
      },
    },
  });

  interface Props extends LoaderProps {
    variant: 'pending-selection' | 'see-preferred';
  }

  const { variant, ...props }: Props = $props();
  type TriggerVariant = typeof variant;

  function getTriggerLabel(variant: TriggerVariant) {
    switch (variant) {
      case 'pending-selection':
        return 'Pending Selection';
      case 'see-preferred':
        return 'See Preferred';
      default:
        throw new Error('unreachable');
    }
  }
</script>

<Drawer.Root>
  <Drawer.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" class={triggerVariants({ variant })} {...props}>
        {getTriggerLabel(variant)}
      </Button>
    {/snippet}
  </Drawer.Trigger>
  <Drawer.Content class="min-h-screen">
    <div class="overflow-auto px-8 pb-40">
      <Loader {...props} />
    </div>
  </Drawer.Content>
</Drawer.Root>
