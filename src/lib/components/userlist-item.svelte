<script lang="ts">
  import MessageSquareTextIcon from '@lucide/svelte/icons/message-square-text';
  import UserIcon from '@lucide/svelte/icons/user';
  import type { LucideIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

  import * as Avatar from '$lib/components/ui/avatar';
  import { cn } from '$lib/components/ui/utils';

  import DraftAvatar from './draft-avatar.svelte';

  interface ProfileAvatarSource {
    variant: 'profile';
    url?: string | null;
    alt?: string;
  }

  interface DraftAvatarSource {
    variant: 'draft';
    objectKey?: string | null;
    alt: string;
  }

  type UserAvatar = ProfileAvatarSource | DraftAvatarSource;

  interface UserlistIcon {
    icon: LucideIcon;
    class?: string;
  }

  interface UserRemarks {
    text?: string | null;
    class?: string;
  }

  interface Props {
    email: string;
    familyName?: string | null;
    givenName?: string | null;
    avatar?: UserAvatar;
    icon?: UserlistIcon;
    studentNumber?: bigint | null;
    remarks?: UserRemarks;
    badges?: Snippet | null;
    actionButtons?: Snippet | null;
    class?: string;
  }

  const {
    email,
    familyName = null,
    givenName = null,
    avatar,
    icon,
    studentNumber = null,
    remarks,
    badges,
    actionButtons,
    class: className,
  }: Props = $props();

  function getDraftAvatarProps({ objectKey, alt }: DraftAvatarSource) {
    if (typeof objectKey === 'undefined' || objectKey === null) return {};
    return { avatar: { objectKey, alt } };
  }
</script>

{#snippet userAvatar()}
  {#if typeof avatar === 'undefined'}
    <!-- Intentionally Empty -->
  {:else if avatar.variant === 'profile'}
    <Avatar.Root class="size-12">
      {#if avatar.url}
        <Avatar.Image src={avatar.url} alt={avatar.alt ?? email} />
      {/if}
      <Avatar.Fallback>
        <UserIcon class="size-1/2 text-muted-foreground" />
      </Avatar.Fallback>
    </Avatar.Root>
  {:else if avatar.variant === 'draft'}
    <DraftAvatar {...getDraftAvatarProps(avatar)} class="size-12" />
  {/if}
{/snippet}
<div class={cn('@container bg-card p-4 rounded-lg', className)}>
  <div class="flex flex-col gap-4">
    <div
      class={cn('grid min-w-0 items-center gap-3', 'grid-cols-[auto_minmax(0,1fr)]', {
        '@sm:grid-cols-[auto_minmax(0,1fr)_auto]': typeof actionButtons === 'function',
      })}
    >
      <div class="flex shrink-0 items-center gap-3">
        {#if typeof icon !== 'undefined'}
          {@const Icon = icon.icon}
          <Icon class={cn('size-5 shrink-0 text-muted-foreground', icon.class)} />
        {/if}
        {@render userAvatar()}
      </div>
      <div class="flex min-w-0 flex-1 flex-col">
        {#if familyName !== null && givenName !== null}
          <span class="inline-flex gap-2">
            <strong class="block min-w-0 truncate text-start">
              <span class="uppercase">{familyName},</span>
              {givenName}
            </strong>
            {@render badges?.()}
          </span>
          <a
            href="mailto:{email}"
            class="min-w-0 max-w-min truncate text-sm text-muted-foreground hover:underline text-start"
          >
            {email}
          </a>
        {:else}
          <a
            href="mailto:{email}"
            class="min-w-0 max-w-min truncate font-semibold hover:underline text-start"
          >
            {email}
          </a>
        {/if}
        {#if studentNumber !== null}
          <span class="text-sm text-muted-foreground text-start">{studentNumber.toString()}</span>
        {/if}
      </div>
      {#if typeof actionButtons === 'function'}
        <div
          class="col-span-2 flex min-w-0 flex-wrap justify-end gap-2 justify-self-end @sm:col-span-1 @sm:col-start-3 @sm:row-start-1"
        >
          {@render actionButtons()}
        </div>
      {/if}
    </div>
    {#if typeof remarks?.text !== 'undefined' && remarks.text !== null}
      <div class="flex gap-2 border-t-2 p-3">
        <MessageSquareTextIcon class="size-4 shrink-0 text-muted-foreground" />
        <pre
          class={cn(
            'min-w-0 text-start font-sans text-xs whitespace-pre-wrap text-muted-foreground',
            remarks.class,
          )}>{remarks.text}</pre>
      </div>
    {/if}
  </div>
</div>
