<script lang="ts">
  import { Badge } from '$lib/components/ui/badge';

  interface Props {
    labId: string | null;
  }

  const { labId }: Props = $props();
</script>

{#if labId !== null}
  <Badge variant="outline" class="border-primary bg-primary/10 text-xs uppercase">
    {labId}
  </Badge>
{/if}
