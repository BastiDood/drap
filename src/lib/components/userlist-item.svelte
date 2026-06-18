<script lang="ts">
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

  interface Props {
    email: string;
    familyName?: string | null;
    givenName?: string | null;
    avatar?: UserAvatar;
    icon?: LucideIcon;
    iconClass?: string;
    studentNumber?: bigint | null;
    remarks?: string | null;
    remarksIcon?: LucideIcon;
    badges?: Snippet | null;
    actionButtons?: Snippet | null;
    class?: string;
  }

  let {
    email,
    familyName = null,
    givenName = null,
    avatar,
    icon: Icon,
    iconClass,
    studentNumber = null,
    remarks = null,
    remarksIcon: RemarksIcon,
    badges,
    actionButtons,
    class: className,
  }: Props = $props();

  const hasActionButtons = $derived(typeof actionButtons === 'function');

  function getDraftAvatarProps({ objectKey, alt }: DraftAvatarSource) {
    if (typeof objectKey === 'undefined' || objectKey === null) return {};
    return { avatar: { objectKey, alt } };
  }
</script>

{#snippet userAvatar()}
  {#if avatar?.variant === 'profile'}
    <Avatar.Root class="size-12">
      {#if avatar.url}
        <Avatar.Image src={avatar.url} alt={avatar.alt ?? email} />
      {/if}
      <Avatar.Fallback>
        <UserIcon class="size-1/2 text-muted-foreground" />
      </Avatar.Fallback>
    </Avatar.Root>
  {:else if avatar?.variant === 'draft'}
    <DraftAvatar {...getDraftAvatarProps(avatar)} class="size-12" />
  {/if}
{/snippet}

<div class={cn('@container bg-card p-4 rounded-lg', className)}>
  <div class="flex flex-col gap-4">
    <div
      class={cn(
        'grid min-w-0 items-center gap-3',
        'grid-cols-[auto_minmax(0,1fr)]',
        hasActionButtons && '@sm:grid-cols-[auto_minmax(0,1fr)_auto]',
      )}
    >
      <div class="flex shrink-0 items-center gap-3">
        {#if typeof Icon !== 'undefined'}
          <Icon class={cn('size-5 shrink-0 text-muted-foreground', iconClass)} />
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
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a
            href={`mailto:${email}`}
            class="min-w-0 max-w-min truncate text-sm text-muted-foreground hover:underline text-start"
          >
            {email}
          </a>
        {:else}
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a
            href={`mailto:${email}`}
            class="min-w-0 max-w-min truncate font-semibold hover:underline text-start"
          >
            {email}
          </a>
        {/if}
        {#if studentNumber !== null}
          <span class="text-sm text-muted-foreground text-start">{studentNumber.toString()}</span>
        {/if}
      </div>
      {#if hasActionButtons}
        <div
          class="col-span-2 flex min-w-0 flex-wrap justify-end gap-2 justify-self-end @sm:col-span-1 @sm:col-start-3 @sm:row-start-1"
        >
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
