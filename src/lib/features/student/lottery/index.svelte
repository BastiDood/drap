<script lang="ts">
  import ShuffleIcon from '@lucide/svelte/icons/shuffle';

  import Empty from '$lib/components/empty.svelte';
</script>

<Empty media={{ icon: ShuffleIcon, size: 'md' }}>
  {#snippet title()}Lottery / Review in Progress{/snippet}
  {#snippet description()}
    The regular draft rounds have completed. The remaining students are being processed through
    lottery assignment and administrator review. You will be notified once finalization is complete.
  {/snippet}
</Empty>
