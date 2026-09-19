<script lang="ts">
  import { resolve } from '$app/paths';
  import * as Avatar from '$lib/components/ui/avatar';
  import UserIcon from '@lucide/svelte/icons/user';

  export interface DraftAvatarProps {
    avatar?: {
      objectKey: string;
      alt: string;
    };
    class?: string;
  }

  const { avatar, class: className }: DraftAvatarProps = $props();
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
