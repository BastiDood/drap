<script lang="ts">
  import { DraftTimeline } from '$lib/features/drafts';

  const { data } = $props();
</script>

<DraftTimeline {...data} />
