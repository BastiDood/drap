<script lang="ts">
  import { DraftTable, InitDialog } from '$lib/features/drafts';

  const { data } = $props();
  const { drafts } = $derived(data);
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-2xl font-bold">Drafts</h2>
      <p class="text-muted-foreground">Manage all draft sessions</p>
    </div>
    <InitDialog />
  </div>

  <DraftTable {drafts} />
</div>
