<script lang="ts">
  import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';

  import { Button, type ButtonSize } from '$lib/components/ui/button';

  export interface Props {
    size?: ButtonSize;
  }

  const { size = 'sm' }: Props = $props();
</script>

<form method="get" action="/dashboard/oauth/login" class="contents">
  <input type="hidden" name="extended" value="1" />
  <Button
    type="submit"
    {size}
    class="h-auto max-w-full gap-2 py-2 text-left leading-tight whitespace-normal"
  >
    <ShieldAlertIcon class="size-6 md:size-4" />
    <span>Volunteer as Candidate Sender</span>
  </Button>
</form>
