<script lang="ts">
  import { tv } from 'tailwind-variants';

  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';

  import Loader, { type Props as LoaderProps } from './loader.svelte';

  const triggerVariants = tv({
    variants: {
      variant: {
        'pending-selection': 'border-warning text-warning',
        'see-preferred': 'h-fit border-accent bg-accent/10 font-mono text-xs uppercase',
      },
    },
  });

  interface Props extends LoaderProps {
    variant: 'pending-selection' | 'see-preferred';
  }

  const { variant, ...props }: Props = $props();

  const triggerLabel = $derived.by(() => {
    switch (variant) {
      case 'pending-selection':
        return 'Pending Selection';
      case 'see-preferred':
        return 'Preferred';
      default:
        throw new Error('unreachable');
    }
  });

  const title = $derived.by(() => {
    switch (variant) {
      case 'pending-selection':
        return 'Pending Selection';
      case 'see-preferred':
        return 'Available Draftees';
      default:
        throw new Error('unreachable');
    }
  });
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" class={triggerVariants({ variant })} {...props}>
        {triggerLabel}
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[600px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>{title}</Sheet.Title>
      <Sheet.Description>Review undrafted students available for selection.</Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col">
      <Loader {...props} />
    </div>
  </Sheet.Content>
</Sheet.Root>
