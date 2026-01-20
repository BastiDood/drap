<script>
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import ScrollText from '@lucide/svelte/icons/scroll-text';

  import DCS from '$lib/assets/dcs.webp?url';
  import Logo from '$lib/assets/logo-DRAP-colored.svg';
  import { resolve } from '$app/paths';
</script>

<div
  class="not-prose mt-4 flex min-h-104 flex-col items-center justify-center rounded-2xl bg-[rgb(30,79,65)] p-6 text-center bg-blend-multiply"
  style="background-image: url({DCS})"
>
  <img src={Logo} alt="Logo of DRAP" class="w-4/5 max-w-136 md:-mb-8" />
  <div>
    <h1 class="text-surface-50 mb-8 text-2xl font-black md:text-4xl">
      Draft Ranking Automated Processor
    </h1>
    <div
      class="flex flex-col items-center justify-center gap-4 *:w-3/5 *:min-w-fit md:flex-row md:gap-2 *:md:w-auto"
    >
      <a
        href={resolve('/dashboard/oauth/login')}
        class="btn btn-xl preset-filled-primary-500 px-4 py-2"
      >
        <ArrowRight />
        <span> Go to Dashboard </span>
      </a>
      <a href={resolve('/history/')} class="btn btn-xl preset-tonal-surface px-4 py-2">
        <ScrollText />
        <span> View Draft </span>
      </a>
    </div>
  </div>
</div>
