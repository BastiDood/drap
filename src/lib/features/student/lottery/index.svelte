<script lang="ts">
  import ShuffleIcon from '@lucide/svelte/icons/shuffle';

  import * as Empty from '$lib/components/ui/empty';
</script>

<Empty.Root>
  <Empty.Media>
    <ShuffleIcon class="text-muted-foreground size-12" />
  </Empty.Media>
  <Empty.Header>
    <Empty.Title>Lottery in Progress</Empty.Title>
    <Empty.Description>
      The regular draft rounds have concluded. Remaining students are being assigned to labs through
      the lottery process. You will be notified once results are finalized.
    </Empty.Description>
  </Empty.Header>
</Empty.Root>
