<script lang="ts">
  import UserIcon from '@lucide/svelte/icons/user';

  import * as Avatar from '$lib/components/ui/avatar';
  import { resolve } from '$app/paths';

  interface Props {
    avatar?: {
      objectKey: string;
      alt: string;
    };
    class?: string;
  }

  const { avatar, class: className }: Props = $props();
</script>

<Avatar.Root class={className}>
  {#if typeof avatar !== 'undefined'}
    {@const { objectKey, alt } = avatar}
    <Avatar.Image src={resolve('/dashboard/avatars/draft/[objectKey]', { objectKey })} {alt} />
  {/if}
  <Avatar.Fallback>
    <UserIcon class="size-1/2 text-muted-foreground" />
  </Avatar.Fallback>
</Avatar.Root>
