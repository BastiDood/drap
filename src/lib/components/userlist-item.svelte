<script lang="ts">
  import UserIcon from '@lucide/svelte/icons/user';
  import type { LucideIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

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

  type UserAvatar = ProfileAvatarSource | DraftAvatarSource;

  interface Props {
    familyName: string;
    givenName: string;
    avatar?: UserAvatar;
    icon?: LucideIcon;
    iconClass?: string;
    studentNumber?: string | null;
    email?: string | null;
    remarks?: string | null;
    remarksIcon?: LucideIcon;
    badges?: Snippet;
    actionButtons?: Snippet;
    class?: string;
  }

  let {
    familyName,
    givenName,
    avatar,
    icon: Icon,
    iconClass,
    studentNumber = null,
    email = null,
    remarks = null,
    remarksIcon: RemarksIcon,
    badges,
    actionButtons,
    class: className,
  }: Props = $props();

  const hasActionButtons = $derived(typeof actionButtons === 'function');
</script>

{#snippet userAvatar()}
  {#if avatar?.variant === 'profile'}
    <Avatar.Root class="size-12">
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
{/snippet}

<div class={cn('bg-card px-6 py-4 rounded-lg', className)}>
  <div class="flex flex-col gap-4">
    <div
      class={cn(
        'grid min-w-0 items-center gap-3',
        hasActionButtons
          ? 'grid-cols-[auto_minmax(0,1fr)_minmax(0,12rem)]'
          : 'grid-cols-[auto_minmax(0,1fr)]',
      )}
    >
      <div class="flex shrink-0 items-center gap-3">
        {#if typeof Icon !== 'undefined'}
          <Icon class={cn('size-5 shrink-0 text-muted-foreground', iconClass)} />
        {/if}
        {@render userAvatar()}
      </div>
      <div class="flex min-w-0 flex-col">
        <span class="flex min-w-0 items-end gap-3">
          <strong class="min-w-0 truncate text-start"
            ><span class="uppercase">{familyName}</span>, {givenName}</strong
          >
          <span class="shrink-0">
            {@render badges?.()}
          </span>
        </span>
        {#if email !== null}
          <span class="text-sm text-muted-foreground">{email}</span>
        {/if}
        {#if studentNumber !== null}
          <span class="text-xs text-muted-foreground">{studentNumber}</span>
        {/if}
      </div>
      {#if hasActionButtons}
        <div class="col-start-3 row-start-1 flex min-w-0 flex-wrap justify-end gap-2">
          {@render actionButtons?.()}
        </div>
      {/if}
    </div>
    {#if remarks !== null}
      <div class="flex gap-2 border-t-2 p-3">
        {#if typeof RemarksIcon !== 'undefined'}
          <RemarksIcon class="size-4 shrink-0 text-muted-foreground" />
        {/if}
        <pre
          class="min-w-0 text-start font-sans text-xs whitespace-pre-wrap text-muted-foreground">{remarks}</pre>
      </div>
    {/if}
  </div>
</div>
