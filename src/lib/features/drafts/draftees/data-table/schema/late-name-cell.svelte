<script lang="ts">
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  interface Props {
    isLate: boolean;
    name: string;
  }

  const { isLate, name }: Props = $props();
</script>

<div class="flex items-center gap-2">
  {#if isLate}
    <TriangleAlertIcon class="size-4 text-amber-500" />
  {/if}
  <span>{name}</span>
</div>
