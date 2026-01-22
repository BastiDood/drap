<script lang="ts">
  import { Bug, GitFork, Github, History, Lock } from '@lucide/svelte';

  import Logo from '$lib/assets/logo-DRAP-icon-colored.svg';
  import { resolve } from '$app/paths';

  import Link from './link.svelte';
</script>

<footer class="border-border space-y-4 border-t p-6">
  <div class="flex flex-col items-start justify-between gap-8 lg:flex-row">
    <div class="flex items-center gap-6">
      <img src={Logo} alt="DRAP Logo" class="size-12" />
      <div class="flex flex-col">
        <span>
          <strong>DRAP</strong>: Draft Ranking Automated Processor
        </span>
        <Link href="https://dcs.upd.edu.ph/" target="_blank">Department of Computer Science</Link>
        <span>University of the Philippines - Diliman</span>
      </div>
    </div>
    <div class="xs:gap-12 xs:flex-row-reverse flex min-w-fit flex-col gap-8 lg:flex-row lg:gap-24">
      <div class="flex flex-col gap-2 text-sm">
        <h6 class="text-muted-foreground font-semibold">Navigation</h6>
        <a
          href={resolve('/history/')}
          class="dark:hover:text-secondary hover:text-muted-foreground/80 inline-flex w-fit items-center gap-1 transition duration-150"
        >
          <History size="16" />
          <span>History</span>
        </a>
        <a
          href={resolve('/privacy/')}
          class="dark:hover:text-secondary hover:text-muted-foreground/80 inline-flex w-fit items-center gap-1 transition duration-150"
        >
          <Lock size="16" />
          <span>Privacy Policy</span>
        </a>
      </div>
      <div class="flex flex-col gap-2 text-sm">
        <h6 class="text-muted-foreground font-semibold">GitHub</h6>
        <a
          href="https://github.com/BastiDood/drap"
          target="_blank"
          rel="noopener noreferrer"
          class="dark:hover:text-secondary hover:text-muted-foreground/80 inline-flex w-fit items-center gap-1 transition duration-150"
        >
          <Github size="16" />
          <span>View Source</span>
        </a>
        <a
          href="https://github.com/BastiDood/drap/fork"
          target="_blank"
          rel="noopener noreferrer"
          class="dark:hover:text-secondary hover:text-muted-foreground/80 inline-flex w-fit items-center gap-1 transition duration-150"
        >
          <GitFork size="16" />
          <span>Fork the Repository</span>
        </a>
        <a
          href="https://github.com/BastiDood/drap/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          class="dark:hover:text-secondary hover:text-muted-foreground/80 inline-flex w-fit items-center gap-1 transition duration-150"
        >
          <Bug size="16" />
          <span>Report a Bug</span>
        </a>
      </div>
    </div>
  </div>
  <small class="text-muted-foreground">&copy; 2026 DRAP Authors. All rights reserved.</small>
</footer>
