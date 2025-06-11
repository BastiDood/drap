<script lang="ts">
  import {
    AcademicCap,
    ArrowRightEndOnRectangle,
    ArrowRightStartOnRectangle,
    Beaker,
    ClipboardDocumentList,
    Clock,
    Envelope,
    FaceSmile,
    Home,
    LockClosed,
    QueueList,
    Users,
  } from '@steeze-ui/heroicons';
  import { AppRail, AppRailAnchor, Avatar, LightSwitch } from '@skeletonlabs/skeleton';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { assert } from '$lib/assert';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import type { schema } from '$lib/server/database';
  import { dev } from '$app/environment';

  // eslint-disable-next-line @typescript-eslint/init-declarations
  export let user: schema.User | undefined;

  $: ({ pathname } = $page.url);
</script>

<AppRail width="w-20">
  <div slot="lead" class="my-4 flex items-center justify-center"><LightSwitch /></div>
  <AppRailAnchor href="/" selected={pathname === '/'}>
    <Icon src={Home} slot="lead" class="h-8" />
    <span>Home</span>
  </AppRailAnchor>
  {#if typeof user !== 'undefined' && user.googleUserId !== null}
    <AppRailAnchor href="/profile/" selected={pathname === '/profile/'}>
      <Avatar slot="lead" width="w-8" src={user.avatarUrl} />
      <span>Profile</span>
    </AppRailAnchor>
    {#if user.labId === null}
      {#if user.isAdmin}
        <!-- Registered Admin -->
        <AppRailAnchor href="/dashboard/labs/" selected={pathname === '/dashboard/labs/'}>
          <Icon src={Beaker} slot="lead" class="h-8" />
          <span>Labs</span>
        </AppRailAnchor>
        <AppRailAnchor href="/dashboard/users/" selected={pathname === '/dashboard/users/'}>
          <Icon src={Users} slot="lead" class="h-8" />
          <span>Users</span>
        </AppRailAnchor>
        <AppRailAnchor href="/dashboard/drafts/" selected={pathname === '/dashboard/drafts/'}>
          <Icon src={ClipboardDocumentList} slot="lead" class="h-8" />
          <span>Drafts</span>
        </AppRailAnchor>
        <AppRailAnchor href="/dashboard/email/" selected={pathname === '/dashboard/email/'}>
          <Icon src={Envelope} slot="lead" class="h-8" />
          <span>Email</span>
        </AppRailAnchor>
      {:else if user.studentNumber !== null}
        <!-- Registered User -->
        <AppRailAnchor href="/dashboard/ranks/" selected={pathname === '/dashboard/ranks/'}>
          <Icon src={QueueList} slot="lead" class="h-8" />
          <span>Ranks</span>
        </AppRailAnchor>
      {/if}
    {:else}
      <!-- Registered Researcher -->
      <AppRailAnchor href="/dashboard/lab/" selected={pathname === '/dashboard/lab/'}>
        <Icon src={Beaker} slot="lead" class="h-8" />
        <span>Lab</span>
      </AppRailAnchor>
      {#if user.isAdmin}
        <!-- Registered Faculty -->
        <AppRailAnchor href="/dashboard/students/" selected={pathname === '/dashboard/students/'}>
          <Icon src={AcademicCap} slot="lead" class="h-8" />
          <span>Students</span>
        </AppRailAnchor>
      {/if}
    {/if}
  {/if}
  <AppRailAnchor href="/history/" selected={pathname.startsWith('/history/')}>
    <Icon src={Clock} slot="lead" class="h-8" />
    <span>History</span>
  </AppRailAnchor>
  <AppRailAnchor href="/privacy/" selected={pathname === '/privacy/'}>
    <Icon src={LockClosed} slot="lead" class="h-8" />
    <span>Privacy</span>
  </AppRailAnchor>
  <svelte:fragment slot="trail">
    {#if typeof user === 'undefined'}
      <div class="p-2">
        <a
          href="/oauth/login/"
          rel="external"
          class="variant-soft-primary btn-icon btn-icon-sm aspect-square w-full"
        >
          <Icon slot="trail" src={ArrowRightEndOnRectangle} class="w-full p-2" />
        </a>
      </div>
    {:else}
      {#if dev}
        <form
          method="post"
          action="/?/dummy"
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
            class="variant-soft-tertiary btn-icon btn-icon-sm aspect-square w-full"
          >
            <Icon slot="trail" src={FaceSmile} class="w-full p-2" />
          </button>
        </form>
      {/if}
      <form
        method="post"
        action="/?/logout"
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
          class="variant-soft-tertiary btn-icon btn-icon-sm aspect-square w-full"
        >
          <Icon slot="trail" src={ArrowRightStartOnRectangle} class="w-full p-2" />
        </button>
      </form>
    {/if}
  </svelte:fragment>
</AppRail>
