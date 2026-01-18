<script lang="ts">
  import {
    AcademicCap,
    ArrowRightEndOnRectangle,
    ArrowRightStartOnRectangle,
    Beaker,
    ClipboardDocumentList,
    Clock,
    Envelope,
    Home,
    LockClosed,
    QueueList,
    UserPlus,
    Users,
  } from '@steeze-ui/heroicons';
  import { Avatar, Navigation } from '@skeletonlabs/skeleton-svelte';
  import { Icon } from '@steeze-ui/svelte-icon';

  import { assert } from '$lib/assert';
  import { dev } from '$app/environment';
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import type { schema } from '$lib/server/database';

  interface Props {
    user?: schema.User;
  }

  const { user }: Props = $props();
  const { pathname } = $derived(page.url);
</script>

<Navigation.Rail
  width="w-16"
  padding="p-0"
  headerGap="gap-0"
  tilesGap="gap-0"
  tilesJustify="justify-start"
  footerGap="gap-0"
  footerClasses="my-1"
  classes="border-primary-950 justify-between border-r-1 shadow-lg"
>
  {#snippet tiles()}
    <Navigation.Tile
      href="/"
      label="Home"
      selected={pathname === '/'}
      padding="px-4 py-2"
      rounded="rounded-none"
      hover="hover:preset-tonal-primary"
      classes="flex-col transition-colors duration-150"
    >
      <Icon src={Home} class="size-8" />
    </Navigation.Tile>
    {#if typeof user !== 'undefined' && user.googleUserId !== null}
      <Navigation.Tile
        href="/dashboard/profile/"
        label="Profile"
        selected={pathname === '/dashboard/profile/'}
        padding="px-4 py-2"
        rounded="rounded-none"
        hover="hover:preset-tonal-primary"
        classes="flex-col transition-colors duration-150"
      >
        <Avatar src={user.avatarUrl} name="{user.givenName} {user.familyName}" size="size-8" />
      </Navigation.Tile>
      {#if user.labId === null}
        {#if user.isAdmin}
          <Navigation.Tile
            href="/dashboard/labs/"
            label="Labs"
            selected={pathname === '/dashboard/labs/'}
            padding="px-4 py-2"
            rounded="rounded-none"
            hover="hover:preset-tonal-primary"
            classes="flex-col transition-colors duration-150"
          >
            <Icon src={Beaker} class="size-8" />
          </Navigation.Tile>
          <Navigation.Tile
            href="/dashboard/users/"
            label="Users"
            selected={pathname === '/dashboard/users/'}
            padding="px-4 py-2"
            rounded="rounded-none"
            hover="hover:preset-tonal-primary"
            classes="flex-col transition-colors duration-150"
          >
            <Icon src={Users} class="size-8" />
          </Navigation.Tile>
          <Navigation.Tile
            href="/dashboard/drafts/"
            label="Drafts"
            selected={pathname === '/dashboard/drafts/'}
            padding="px-4 py-2"
            rounded="rounded-none"
            hover="hover:preset-tonal-primary"
            classes="flex-col transition-colors duration-150"
          >
            <Icon src={ClipboardDocumentList} class="size-8" />
          </Navigation.Tile>
          <Navigation.Tile
            href="/dashboard/email/"
            label="Email"
            selected={pathname === '/dashboard/email/'}
            padding="px-4 py-2"
            rounded="rounded-none"
            hover="hover:preset-tonal-primary"
            classes="flex-col transition-colors duration-150"
          >
            <Icon src={Envelope} class="size-8" />
          </Navigation.Tile>
        {:else if user.studentNumber !== null}
          <Navigation.Tile
            href="/dashboard/ranks/"
            label="Ranks"
            selected={pathname === '/dashboard/ranks/'}
            padding="px-4 py-2"
            rounded="rounded-none"
            hover="hover:preset-tonal-primary"
            classes="flex-col transition-colors duration-150"
          >
            <Icon src={QueueList} class="size-8" />
          </Navigation.Tile>
        {/if}
      {:else}
        <Navigation.Tile
          href="/dashboard/lab/"
          label="Lab"
          selected={pathname === '/dashboard/lab/'}
          padding="px-4 py-2"
          rounded="rounded-none"
          hover="hover:preset-tonal-primary"
          classes="flex-col transition-colors duration-150"
        >
          <Icon src={Beaker} class="size-8" />
        </Navigation.Tile>
        {#if user.isAdmin}
          <Navigation.Tile
            href="/dashboard/students/"
            label="Students"
            selected={pathname === '/dashboard/students/'}
            padding="px-4 py-2"
            rounded="rounded-none"
            hover="hover:preset-tonal-primary"
            classes="flex-col transition-colors duration-150"
          >
            <Icon src={AcademicCap} class="size-8" />
          </Navigation.Tile>
        {/if}
      {/if}
    {/if}
    <Navigation.Tile
      href="/history/"
      label="History"
      selected={pathname.startsWith('/history/')}
      padding="px-4 py-2"
      rounded="rounded-none"
      hover="hover:preset-tonal-primary"
      classes="flex-col transition-colors duration-150"
    >
      <Icon src={Clock} class="size-8" />
    </Navigation.Tile>
    <Navigation.Tile
      href="/privacy/"
      label="Privacy"
      selected={pathname === '/privacy/'}
      padding="px-4 py-2"
      rounded="rounded-none"
      hover="hover:preset-tonal-primary"
      classes="flex-col transition-colors duration-150"
    >
      <Icon src={LockClosed} class="size-8" />
    </Navigation.Tile>
  {/snippet}
  {#snippet footer()}
    {#if typeof user === 'undefined'}
      {#if dev}
        <form
          method="post"
          action="/dashboard/oauth/?/dummy"
          use:enhance={({ submitter }) => {
            assert(submitter !== null);
            assert(submitter instanceof HTMLButtonElement);
            submitter.disabled = true;
            return async ({ update }) => {
              submitter.disabled = false;
              await update();
            };
          }}
          class="p-1"
        >
          <button
            type="submit"
            class="preset-filled-secondary-100-900 hover:preset-tonal-secondary size-full rounded-full p-3 transition-colors duration-150"
          >
            <Icon src={UserPlus} />
          </button>
        </form>
      {/if}
      <div class="p-1">
        <a
          href="/dashboard/oauth/login"
          rel="external"
          class="preset-filled-tertiary-100-900 hover:preset-tonal-tertiary block rounded-full p-3 transition-colors duration-150"
        >
          <Icon src={ArrowRightEndOnRectangle} />
        </a>
      </div>
    {:else}
      <form
        method="post"
        action="/dashboard/oauth/?/logout"
        class="p-2"
        use:enhance={({ submitter }) => {
          assert(submitter !== null);
          assert(submitter instanceof HTMLButtonElement);
          submitter.disabled = true;
          return async ({ update }) => {
            submitter.disabled = false;
            await update();
          };
        }}
      >
        <button
          type="submit"
          class="preset-filled-tertiary-100-900 hover:preset-tonal-tertiary size-full rounded-full p-3 transition-colors duration-150"
        >
          <Icon src={ArrowRightStartOnRectangle} />
        </button>
      </form>
    {/if}
  {/snippet}
</Navigation.Rail>
