<script lang="ts">
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';

  import * as Sheet from '$lib/components/ui/sheet';
  import { Button, type ButtonSize } from '$lib/components/ui/button';
  import { cn } from '$lib/components/ui/utils';

  import Loader, { type Props } from './loader.svelte';

  interface TriggerProps extends Props {
    triggerSize?: ButtonSize;
  }

  const { triggerSize, ...loaderProps }: TriggerProps = $props();
</script>

<Sheet.Root>
  <Sheet.Trigger>
    {#snippet child({ props })}
      <Button
        variant="outline"
        size={triggerSize}
        class={cn({ 'border-primary text-primary': triggerSize !== 'sm' })}
        {...props}
      >
        {#if triggerSize === 'sm'}
          <GraduationCapIcon class="size-4" />
        {/if}
        <span>{triggerSize === 'sm' ? 'See Drafted' : 'Already Drafted'}</span>
      </Button>
    {/snippet}
  </Sheet.Trigger>
  <Sheet.Content
    side="right"
    class="flex w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-[600px]"
  >
    <Sheet.Header class="shrink-0 p-0 pe-10">
      <Sheet.Title>Already Drafted</Sheet.Title>
      <Sheet.Description>Review students who have already been assigned.</Sheet.Description>
    </Sheet.Header>
    <div class="flex min-h-0 grow flex-col">
      <Loader {...loaderProps} />
    </div>
  </Sheet.Content>
</Sheet.Root>
