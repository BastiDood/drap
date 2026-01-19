<script lang="ts">
  import { Bug } from '@lucide/svelte';
  import { GitFork } from '@lucide/svelte';
  import { Github } from '@lucide/svelte';
  import { History } from '@lucide/svelte';
  import { Lock } from '@lucide/svelte';
  import Logo from '$lib/assets/logo-DRAP-icon-colored.svg';

  const navigationLinks = [
    {
      href: '/history/',
      label: 'History',
      icon: History,
    },
    {
      href: '/privacy/',
      label: 'Privacy Policy',
      icon: Lock,
    },
  ];
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
  <div class="flex flex-col items-start justify-between gap-8">
    <div class="flex items-center gap-4">
      <img src={Logo} alt="DRAP Logo" class="size-10" />
      <span>
        <strong>DRAP</strong> — Draft Ranking Automated Processor for the
        <a
        target="_blank"
        href="https://dcs.upd.edu.ph/"
        class="hover:text-secondary-500 decoration-surface-300 underline underline-offset-3 transition"
        >
        UP Diliman - Department of Computer Science
      </a>
      </span>
    </div>
    <div class="flex flex-col gap-2 text-sm">
      <div class="flex min-w-fit flex-col gap-4 lg:flex-row lg:gap-24">
        <div class="flex flex-col gap-2 text-sm">
          <h6 class="text-surface-400 font-semibold">Navigation</h6>
          {#each navigationLinks as { href, label, icon: Icon }}
            <a
              {href}
              class="hover:text-secondary-500 inline-flex w-fit items-center gap-1 transition duration-150"
            >
              <Icon size="16" />
              <span>{label}</span>
            </a>
          {/each}
        </div>
        <div class="flex flex-col gap-2 text-sm">
          <h6 class="text-surface-400 font-semibold">GitHub</h6>
          {#each externalLinks as { href, label, icon: Icon }}
            <a
              {href}
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-secondary-500 inline-flex w-fit items-center gap-1 transition duration-150"
            >
              <Icon size="16" />
              <span>{label}</span>
            </a>
          {/each}
        </div>
      </div>
    </div>
  </div>
  <small class="text-surface-300">&copy; 2026 DRAP Authors. All rights reserved.</small>
</footer>
