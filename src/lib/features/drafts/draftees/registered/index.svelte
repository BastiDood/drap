<script lang="ts">
  import { tv } from 'tailwind-variants';

  import * as Sheet from '$lib/components/ui/sheet';
  import { Button } from '$lib/components/ui/button';

  import Loader, { type Props as LoaderProps } from './loader.svelte';

  const triggerVariants = tv({
    variants: {
      variant: {
        primary: 'border-primary text-primary',
        accent: 'border-accent text-accent',
      },
    },
  });

  interface Props extends LoaderProps {
    variant: 'primary' | 'accent';
  }

  const { variant, ...props }: Props = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button variant="outline" class={triggerVariants({ variant })} {...props}>
        See Registered Students
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[600px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>Registered Students</Sheet.Title>
      <Sheet.Description>Review students who have registered for this draft.</Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col">
      <Loader {...props} />
    </div>
  </Sheet.Content>
</Sheet.Root>
