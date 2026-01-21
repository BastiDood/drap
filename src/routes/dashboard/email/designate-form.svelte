<script lang="ts" context="module">
  import ArrowDown from '@lucide/svelte/icons/arrow-down';
  import ArrowUp from '@lucide/svelte/icons/arrow-up';
  import X from '@lucide/svelte/icons/x';
  import type { Component } from 'svelte';

  import { SenderAction } from './constants';

  interface SenderControls {
    action: SenderAction;
    buttonClass: string;
    cardClass: string;
    text: string;
    icon: Component;
  }

  function useSenderControls(isActive: boolean): SenderControls {
    return isActive
      ? {
          action: SenderAction.Demote,
          buttonClass: 'bg-warning text-warning-foreground hover:bg-warning/80',
          cardClass: 'border border-border bg-muted',
          text: 'Demote',
          icon: ArrowDown,
        }
      : {
          action: SenderAction.Promote,
          buttonClass: 'bg-success text-success-foreground hover:bg-success/80',
          cardClass: 'bg-muted',
          text: 'Promote',
          icon: ArrowUp,
        };
  }
</script>

<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import { cn } from '$lib/components/ui/utils';
  import { enhance } from '$app/forms';
  import type { schema } from '$lib/server/database';

  interface User extends Pick<
    schema.User,
    'id' | 'email' | 'givenName' | 'familyName' | 'avatarUrl'
  > {
    isActive: boolean;
  }

  // eslint-disable-next-line @typescript-eslint/init-declarations
  export let senders: User[];
  let disabled = false;
</script>

<dl class="space-y-2">
  {#each senders as { id, email, givenName, familyName, avatarUrl, isActive } (email)}
    {@const { action, buttonClass, cardClass, text, icon: Icon } = useSenderControls(isActive)}
    <div class={cn('flex min-w-max gap-3 rounded-lg p-2', cardClass)}>
      <Avatar.Root class="size-12">
        <Avatar.Image src={avatarUrl} alt="{givenName} {familyName}" />
        <Avatar.Fallback>{givenName[0]}{familyName[0]}</Avatar.Fallback>
      </Avatar.Root>
      <div class="grow">
        <dt><strong><span class="uppercase">{familyName}</span>, {givenName}</strong></dt>
        <dd class="text-sm opacity-50">{email}</dd>
      </div>
      <form
        method="post"
        class="flex gap-1"
        use:enhance={() => {
          disabled = true;
          return async ({ update }) => {
            disabled = false;
            await update();
          };
        }}
      >
        <input type="hidden" name="user-id" value={id} />
        <Button
          type="submit"
          size="sm"
          {disabled}
          formaction="/dashboard/email/?/{action}"
          class={buttonClass}
        >
          <Icon class="size-4" />
          <span>{text}</span>
        </Button>
        <Button
          type="submit"
          size="sm"
          variant="destructive"
          {disabled}
          formaction="/dashboard/email/?/remove"
        >
          <X class="size-4" />
          <span>Remove</span>
        </Button>
      </form>
    </div>
  {/each}
</dl>
