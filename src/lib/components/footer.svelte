<script lang="ts">
  import { Bug, GitFork, Github, History, Lock } from '@lucide/svelte';

  import Logo from '$lib/assets/logo-DRAP-icon-colored.svg';
  import { resolve } from '$app/paths';

  const externalLinks = [
    {
      href: 'https://github.com/BastiDood/drap',
      label: 'View Source',
      icon: Github,
    },
    {
      href: 'https://github.com/BastiDood/drap/fork',
      label: 'Fork the Repository',
      icon: GitFork,
    },
    {
      href: 'https://github.com/BastiDood/drap/issues/new',
      label: 'Report a Bug',
      icon: Bug,
    },
  ];
</script>

<footer class="border-surface-700 space-y-4 border-t p-6">
  <div class="flex flex-col items-start justify-between lg:flex-row">
    <div class="flex items-center gap-6">
      <img src={Logo} alt="DRAP Logo" class="size-12" />
      <div class="flex flex-col">
        <span>
          <strong>DRAP</strong>: Draft Ranking Automated Processor
        </span>
        <a
          target="_blank"
          href="https://dcs.upd.edu.ph/"
          class="hover:text-secondary-500 decoration-surface-300 underline underline-offset-3 transition"
        >
          Department of Computer Science
        </a>
        <span>University of the Philippines - Diliman</span>
      </div>
    </div>
    <div class="flex min-w-fit flex-col gap-4 lg:flex-row lg:gap-24">
      <div class="flex flex-col gap-2 text-sm">
        <h6 class="text-surface-400 font-semibold">Navigation</h6>
        <a
          href={resolve('/history/')}
          class="hover:text-secondary-500 inline-flex w-fit items-center gap-1 transition duration-150"
        >
          <History size="16" />
          <span>History</span>
        </a>
        <a
          href={resolve('/privacy/')}
          class="hover:text-secondary-500 inline-flex w-fit items-center gap-1 transition duration-150"
        >
          <Lock size="16" />
          <span>Privacy Policy</span>
        </a>
      </div>
      <div class="flex flex-col gap-2 text-sm">
        <h6 class="text-surface-400 font-semibold">GitHub</h6>
        {#each externalLinks as { href, label, icon: Icon } (href)}
          <!-- eslint-disable svelte/no-navigation-without-resolve -->
          <a
            {href}
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-secondary-500 inline-flex w-fit items-center gap-1 transition duration-150"
          >
            <Icon size="16" />
            <span>{label}</span>
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
        {/each}
      </div>
    </div>
  </div>
  <small class="text-surface-300">&copy; 2026 DRAP Authors. All rights reserved.</small>
</footer>
