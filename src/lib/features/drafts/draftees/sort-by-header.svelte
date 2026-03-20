<script lang="ts">
  import ArrowUpDownIcon from '@lucide/svelte/icons/arrow-up-down';

  import { Button, type Props as ButtonProps } from '$lib/components/ui/button';

  interface Props extends ButtonProps {
    header: string;
  }

  const { header, variant = 'ghost', ...restProps }: Props = $props();
</script>

<Button {variant} {...restProps}>
  {header}
  <ArrowUpDownIcon class="h-5 w-5" />
</Button>
