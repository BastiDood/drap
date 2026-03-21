<script lang="ts">
  import ShuffleIcon from '@lucide/svelte/icons/shuffle';

  import * as Empty from '$lib/components/ui/empty';
</script>

<Empty.Root>
  <Empty.Media>
    <ShuffleIcon class="size-12 text-muted-foreground" />
  </Empty.Media>
  <Empty.Header>
    <Empty.Title>Lottery / Review in Progress</Empty.Title>
    <Empty.Description>
      The regular draft rounds have completed. The remaining students are being processed through
      lottery assignment and administrator review. You will be notified once finalization is
      complete.
    </Empty.Description>
  </Empty.Header>
</Empty.Root>
