<script>
  import ArrowRight from '@lucide/svelte/icons/arrow-right';
  import ScrollText from '@lucide/svelte/icons/scroll-text'

  import DCS from '$lib/assets/dcs.webp?url';
  import Logo from '$lib/assets/logo-DRAP-colored.svg';
  import { resolve } from '$app/paths';
</script>

<div
  class="mt-4 flex min-h-104 flex-col items-center rounded-2xl bg-[rgb(30,79,65)] text-center bg-blend-multiply p-6 not-prose justify-center"
  style="background-image: url({DCS})"
>
  <img src={Logo} alt="Logo of DRAP" class="w-4/5 max-w-136 md:-mb-8" />
  <div>
    <h1 class="text-surface-50 font-black text-2xl md:text-4xl mb-8">Draft Ranking Automated Processor</h1>
    <div class="gap-2 flex *:w-fit items-center justify-center">
        <a href={resolve('/dashboard/oauth/login')} class="btn btn-xl preset-filled-primary-500 px-4 py-2">
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
