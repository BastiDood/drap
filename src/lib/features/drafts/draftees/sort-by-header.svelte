<script lang="ts">
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';
  import type { ComponentProps } from 'svelte';

  import { Button } from '$lib/components/ui/button';

  interface Props extends ComponentProps<typeof Button> {
    header: string;
  }

  const { header, variant = 'ghost', ...restProps }: Props = $props();
</script>

<Button {variant} {...restProps}>
  {header}
  <ArrowUpDownIcon class="h-5 w-5" />
</Button>
