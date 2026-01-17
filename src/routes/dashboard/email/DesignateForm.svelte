<script lang="ts" context="module">
  import { ArrowDown, ArrowUp, XMark } from '@steeze-ui/heroicons';
  function useSenderControls(isActive: boolean) {
    return isActive
      ? ([
          'demote',
          'preset-filled-warning-500',
          'preset-tonal-surface outline outline-surface-500',
          'Demote',
          ArrowDown,
        ] as const)
      : ([
          'promote',
          'preset-filled-success-500',
          'preset-tonal-surface',
          'Promote',
          ArrowUp,
        ] as const);
  }
</script>

<script lang="ts">
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
  import { Icon } from '@steeze-ui/svelte-icon';

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

<dl class="list-dl">
  {#each senders as { id, email, givenName, familyName, avatarUrl, isActive } (email)}
    {@const [action, variant, card, text, icon] = useSenderControls(isActive)}
    <div class="card {card} flex min-w-max gap-3 p-2">
      <Avatar src={avatarUrl} name="{givenName} {familyName}" size="size-12" />
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
        <button
          type="submit"
          {disabled}
          formaction="/dashboard/email/?/{action}"
          class="{variant} btn btn-sm"
        >
          <Icon src={icon} class="h-4" />
          <span>{text}</span>
        </button>
        <button
          type="submit"
          {disabled}
          formaction="/dashboard/email/?/remove"
          class="preset-filled-error-500 btn btn-sm"
        >
          <Icon src={XMark} class="h-4" />
          <span>Remove</span>
        </button>
      </form>
    </div>
  {/each}
</dl>
