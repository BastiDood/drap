<script lang="ts">
  import type { LucideIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';
  import { tv, type VariantProps } from 'tailwind-variants';

  import * as Empty from '$lib/components/ui/empty';
  import { cn } from '$lib/components/ui/utils';

  const emptyWrapperMediaVariants = tv({
    base: 'flex shrink-0 items-center justify-center',
    variants: {
      size: {
        sm: 'size-10 rounded-lg',
        md: 'size-14 rounded-lg',
        lg: 'size-20 rounded-xl',
      },
      variant: {
        default: 'border border-border bg-muted text-foreground',
        info: 'preset-tonal-accent',
        success: 'preset-tonal-success',
        warning: 'preset-tonal-warning',
        destructive: 'preset-tonal-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  });

  const emptyWrapperMediaIconVariants = tv({
    base: 'shrink-0',
    variants: {
      size: {
        sm: 'size-6',
        md: 'size-8',
        lg: 'size-12',
      },
    },
  });

  const emptyWrapperTitleVariants = tv({
    variants: {
      variant: {
        default: 'text-foreground brightness-80',
        info: 'text-accent brightness-80',
        warning: 'text-warning brightness-80',
        destructive: 'text-destructive brightness-80',
        success: 'text-success brightness-80',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  });

  const emptyWrapperDescVariants = tv({
    variants: {
      variant: {
        default: 'text-muted-foreground',
        info: 'text-accent-neutral',
        warning: 'text-warning-neutral',
        destructive: 'text-destructive-neutral',
        success: 'text-success-neutral',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  });

  type EmptyVariantProps = VariantProps<typeof emptyWrapperMediaVariants>;
  type EmptyVariant = EmptyVariantProps['variant'];
  type EmptySizeVariant = EmptyVariantProps['size'];

  interface EmptyMediaProps {
    icon: LucideIcon;
    size: EmptySizeVariant;
    mediaClass?: string;
    iconClass?: string;
  }

  interface Props {
    variant?: EmptyVariant;
    media?: EmptyMediaProps;
    title?: Snippet;
    description?: Snippet;
    class?: string;
    children?: Snippet;
  }

  const {
    variant = 'default',
    media,
    title,
    description,
    class: className,
    children,
  }: Props = $props();
</script>

<Empty.Root class={className}>
  {#if typeof media !== 'undefined'}
    <Empty.Media
      class={emptyWrapperMediaVariants({
        variant,
        size: media.size,
        class: media.mediaClass,
      })}
    >
      <media.icon
        class={cn(emptyWrapperMediaIconVariants({ size: media.size }), media.iconClass)}
      />
    </Empty.Media>
  {/if}
  <Empty.Header class="empty:hidden">
    {#if typeof title !== 'undefined'}
      <Empty.Title class={emptyWrapperTitleVariants({ variant })} children={title} />
    {/if}
    {#if typeof description !== 'undefined'}
      <Empty.Description class={emptyWrapperDescVariants({ variant })} children={description} />
    {/if}
  </Empty.Header>
  {#if typeof children !== 'undefined'}
    <Empty.Content {children} />
  {/if}
</Empty.Root>
