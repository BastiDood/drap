<script lang="ts">
  import ListFilterIcon from '@lucide/svelte/icons/list-filter';

  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { cn } from '$lib/components/ui/utils';

  interface Props {
    header: string;
    filtered: boolean;
    options: { count: number; value: string }[];
    value: string;
    onValueChange: (value: string) => void;
  }

  const { header, filtered, options, value, onValueChange }: Props = $props();
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    <button
      type="button"
      class={cn(
        'inline-flex items-center gap-1 rounded-sm p-0 text-inherit transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-100',
        { 'cursor-pointer': options.length > 0 },
      )}
      disabled={options.length === 0}
    >
      <span>{header}</span>
      <span
        class={cn(
          'flex w-4 items-center justify-center',
          !filtered && 'text-muted-foreground',
          filtered && 'text-secondary',
        )}
      >
        <ListFilterIcon class="size-4" />
      </span>
    </button>
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="start" class="min-w-44">
    <DropdownMenu.RadioGroup {value} {onValueChange}>
      <DropdownMenu.RadioItem value="">
        <span>All</span>
      </DropdownMenu.RadioItem>
      <DropdownMenu.Separator />
      {#each options as option (option.value)}
        <DropdownMenu.RadioItem value={option.value}>
          <span class="uppercase">{option.value}</span>
          <span class="ml-auto text-xs text-muted-foreground tabular-nums">{option.count}</span>
        </DropdownMenu.RadioItem>
      {/each}
    </DropdownMenu.RadioGroup>
  </DropdownMenu.Content>
</DropdownMenu.Root>
