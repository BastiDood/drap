<script lang="ts">
  import type { LucideIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  import { Badge } from '$lib/components/ui/badge';
  import UserIcon from '@lucide/svelte/icons/user';
  import * as Avatar from '$lib/components/ui/avatar';
  import { cn } from '$lib/components/ui/utils';
  import DraftAvatar, { type DraftAvatarProps } from './draft-avatar.svelte';

  interface ProfileAvatarSource {
    variant: 'profile';
    url?: string | null;
  }

  interface DraftAvatarSource {
    variant: 'draft';
    props: DraftAvatarProps;
  }

  type UserListAvatar = ProfileAvatarSource | DraftAvatarSource;

  interface Props {
    familyName: string;
    givenName: string;
    avatar?: UserListAvatar;
    studentNumber?: string;
    email?: string;
    icon?: LucideIcon;
    remarks?: string;
    badges?: Snippet;
    actionButtons?: Snippet;
    class?: string;
  }

  let {
    familyName,
    givenName,
    avatar,
    studentNumber,
    email,
    icon,
    remarks,
    badges,
    actionButtons,
    class: className,
  }: Props = $props();
</script>

<div class={cn('flex items-center gap-3 bg-card px-6 py-4 rounded-lg', className)}>
  {#if avatar?.variant === 'profile'}
    <Avatar.Root class="size-10">
      {#if avatar.url}
        <Avatar.Image src={avatar.url} alt="{givenName} {familyName}" />
      {/if}
      <Avatar.Fallback>
        <UserIcon class="size-1/2 text-muted-foreground" />
      </Avatar.Fallback>
    </Avatar.Root>
  {:else if avatar?.variant === 'draft'}
    <DraftAvatar {...avatar.props} />
  {/if}
  <span>
    <strong class="text-start"><span class="uppercase">{familyName}</span>, {givenName}</strong>
  </span>
</div>
