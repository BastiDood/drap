<script lang="ts">
  import ClipboardList from '@lucide/svelte/icons/clipboard-list';
  import Clock from '@lucide/svelte/icons/clock';
  import FlaskConical from '@lucide/svelte/icons/flask-conical';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Home from '@lucide/svelte/icons/home';
  import List from '@lucide/svelte/icons/list';
  import LockKeyhole from '@lucide/svelte/icons/lock-keyhole';
  import LogIn from '@lucide/svelte/icons/log-in';
  import LogOut from '@lucide/svelte/icons/log-out';
  import Mail from '@lucide/svelte/icons/mail';
  import UserPlus from '@lucide/svelte/icons/user-plus';
  import Users from '@lucide/svelte/icons/users';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Sidebar from '$lib/components/ui/sidebar';
  import { assert } from '$lib/assert';
  import { Button } from '$lib/components/ui/button';
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
                    <Home class="size-5" />
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
                          <FlaskConical class="size-5" />
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
                          <Users class="size-5" />
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
                          <ClipboardList class="size-5" />
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
                          <Mail class="size-5" />
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
                          <List class="size-5" />
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
                        <FlaskConical class="size-5" />
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
                          <GraduationCap class="size-5" />
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
                    <Clock class="size-5" />
                    <span>History</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>

            <Sidebar.MenuItem>
              <Sidebar.MenuButton isActive={pathname === '/privacy/'} tooltipContent="Privacy">
                {#snippet child({ props })}
                  <a href={resolve('/privacy/')} {...props}>
                    <LockKeyhole class="size-5" />
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
                <Button
                  type="submit"
                  variant="secondary"
                  size="icon"
                  class="size-full rounded-full"
                >
                  <UserPlus class="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Create Dummy User</TooltipContent>
            </Tooltip>
          </form>
        {/if}
        <Tooltip>
          <TooltipTrigger>
            <Button
              href="/dashboard/oauth/login"
              variant="outline"
              size="icon"
              class="size-full rounded-full"
            >
              <LogIn class="size-5" />
            </Button>
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
              <Button type="submit" variant="outline" size="icon" class="size-full rounded-full">
                <LogOut class="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Logout</TooltipContent>
          </Tooltip>
        </form>
      {/if}
    </Sidebar.Footer>
  </Sidebar.Root>
</TooltipProvider>
