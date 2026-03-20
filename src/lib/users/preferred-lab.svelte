<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';

  interface Props {
    labs: string[];
  }

  const { labs }: Props = $props();
</script>

<div class="overflow-x-auto">
  {#each labs as lab (lab)}
    <Badge variant="outline" class="border-accent bg-accent/10 text-xs uppercase mr-1">
      {lab}
    </Badge>
  {/each}
</div>