<script lang="ts">
  import ClipboardListIcon from '@lucide/svelte/icons/clipboard-list';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import FlaskConicalIcon from '@lucide/svelte/icons/flask-conical';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import HomeIcon from '@lucide/svelte/icons/home';
  import ListIcon from '@lucide/svelte/icons/list';
  import LockKeyholeIcon from '@lucide/svelte/icons/lock-keyhole';
  import LogInIcon from '@lucide/svelte/icons/log-in';
  import LogOutIcon from '@lucide/svelte/icons/log-out';
  import MailIcon from '@lucide/svelte/icons/mail';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import UsersIcon from '@lucide/svelte/icons/users';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { assert } from '$lib/assert';
  import { buttonVariants } from '$lib/components/ui/button';
  import { dev } from '$app/environment';
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { schema } from '$lib/server/database';
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from '$lib/components/ui/tooltip';

  interface Props {
    user?: schema.User;
  }

  const { user }: Props = $props();
  const { pathname } = $derived(page.url);
</script>

<TooltipProvider>
  <Sidebar.Root collapsible="icon" class="border-border border-r">
    <Sidebar.Content>
      <Sidebar.Group>
        <Sidebar.GroupContent>
          <Sidebar.Menu>
            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={pathname === '/'} tooltipContent="Home">
                {#snippet child({ props })}
                  <a href={resolve('/')} {...props}>
                    <HomeIcon class="size-5" />
                    <span>Home</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            {#if typeof user !== 'undefined' && user.googleUserId !== null}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton
                  isActive={pathname === '/dashboard/profile/'}
                  tooltipContent="Profile"
                >
                  {#snippet child({ props })}
                    <a href={resolve('/dashboard/profile/')} {...props}>
                      <Avatar.Root class="size-5">
                        <Avatar.Image
                          src={user.avatarUrl}
                          alt="{user.givenName} {user.familyName}"
                        />
                        <Avatar.Fallback class="text-xs"
                          >{user.givenName[0]}{user.familyName[0]}</Avatar.Fallback
                        >
                      </Avatar.Root>
                      <span>Profile</span>
                    </a>
                  {/snippet}
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>

              {#if user.labId === null}
                {#if user.isAdmin}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      isActive={pathname === '/dashboard/labs/'}
                      tooltipContent="Labs"
                    >
                      {#snippet child({ props })}
                        <a href={resolve('/dashboard/labs/')} {...props}>
                          <FlaskConicalIcon class="size-5" />
                          <span>Labs</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      isActive={pathname === '/dashboard/users/'}
                      tooltipContent="Users"
                    >
                      {#snippet child({ props })}
                        <a href={resolve('/dashboard/users/')} {...props}>
                          <UsersIcon class="size-5" />
                          <span>Users</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      isActive={pathname === '/dashboard/drafts/'}
                      tooltipContent="Drafts"
                    >
                      {#snippet child({ props })}
                        <a href={resolve('/dashboard/drafts/')} {...props}>
                          <ClipboardListIcon class="size-5" />
                          <span>Drafts</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      isActive={pathname === '/dashboard/email/'}
                      tooltipContent="Email"
                    >
                      {#snippet child({ props })}
                        <a href={resolve('/dashboard/email/')} {...props}>
                          <MailIcon class="size-5" />
                          <span>Email</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                {:else if user.studentNumber !== null}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      isActive={pathname === '/dashboard/ranks/'}
                      tooltipContent="Ranks"
                    >
                      {#snippet child({ props })}
                        <a href={resolve('/dashboard/ranks/')} {...props}>
                          <ListIcon class="size-5" />
                          <span>Ranks</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                {/if}
              {:else}
                <Sidebar.MenuItem>
                  <Sidebar.MenuButton
                    isActive={pathname === '/dashboard/lab/'}
                    tooltipContent="Lab"
                  >
                    {#snippet child({ props })}
                      <a href={resolve('/dashboard/lab/')} {...props}>
                        <FlaskConicalIcon class="size-5" />
                        <span>Lab</span>
                      </a>
                    {/snippet}
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
                {#if user.isAdmin}
                  <Sidebar.MenuItem>
                    <Sidebar.MenuButton
                      isActive={pathname === '/dashboard/students/'}
                      tooltipContent="Students"
                    >
                      {#snippet child({ props })}
                        <a href={resolve('/dashboard/students/')} {...props}>
                          <GraduationCapIcon class="size-5" />
                          <span>Students</span>
                        </a>
                      {/snippet}
                    </Sidebar.MenuButton>
                  </Sidebar.MenuItem>
                {/if}
              {/if}
            {/if}

            <Sidebar.MenuItem>
              <Sidebar.MenuButton
                isActive={pathname.startsWith('/history/')}
                tooltipContent="History"
              >
                {#snippet child({ props })}
                  <a href={resolve('/history/')} {...props}>
                    <ClockIcon class="size-5" />
                    <span>History</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={pathname === '/privacy/'} tooltipContent="Privacy">
                {#snippet child({ props })}
                  <a href={resolve('/privacy/')} {...props}>
                    <LockKeyholeIcon class="size-5" />
                    <span>Privacy</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          </Sidebar.Menu>
        </Sidebar.GroupContent>
      </Sidebar.Group>
    </Sidebar.Content>

    <Sidebar.Footer>
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
          >
            <Tooltip>
              <TooltipTrigger>
                {#snippet child({ props })}
                  <button
                    {...props}
                    type="submit"
                    class={buttonVariants({
                      variant: 'secondary',
                      size: 'icon',
                      class: 'size-full rounded-full',
                    })}
                  >
                    <UserPlusIcon class="size-5" />
                  </button>
                {/snippet}
              </TooltipTrigger>
              <TooltipContent side="right">Create Dummy User</TooltipContent>
            </Tooltip>
          </form>
        {/if}
        <Tooltip>
          <TooltipTrigger>
            {#snippet child({ props })}
              <a
                {...props}
                href={resolve('/dashboard/oauth/login')}
                class={buttonVariants({
                  variant: 'outline',
                  size: 'icon',
                  class: 'size-full rounded-full',
                })}
              >
                <LogInIcon class="size-5" />
              </a>
            {/snippet}
          </TooltipTrigger>
          <TooltipContent side="right">Login</TooltipContent>
        </Tooltip>
      {:else}
        <form
          method="post"
          action="/dashboard/oauth/?/logout"
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
          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <button
                  {...props}
                  type="submit"
                  class={buttonVariants({
                    variant: 'outline',
                    size: 'icon',
                    class: 'size-full rounded-full',
                  })}
                >
                  <LogOutIcon class="size-5" />
                </button>
              {/snippet}
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        </form>
      {/if}
    </Sidebar.Footer>
  </Sidebar.Root>
</TooltipProvider>
