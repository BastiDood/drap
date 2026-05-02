<script lang="ts" module>
  import type { SenderRole } from '$lib/features/users/types';

  export interface Props {
    role: SenderRole;
  }
</script>

<script lang="ts">
  import ShieldCheckIcon from '@lucide/svelte/icons/shield-check';
  import StarIcon from '@lucide/svelte/icons/star';

  import { Badge } from '$lib/components/ui/badge';

  const { role }: Props = $props();
</script>

<span class="inline-flex min-w-38 items-center">
  {#if role === 'designated'}
    <Badge variant="default">
      <StarIcon class="size-3" />
      <span>Designated Sender</span>
    </Badge>
  {:else if role === 'candidate'}
    <Badge variant="secondary">
      <ShieldCheckIcon class="size-3" />
      <span>Candidate Sender</span>
    </Badge>
  {/if}
</span>
