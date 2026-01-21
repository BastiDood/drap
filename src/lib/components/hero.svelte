<script>
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';

  import Logo from '$lib/assets/logo-DRAP-colored.svg';
  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';
</script>

<div
  class="not-prose bg-dcs m-6 flex min-h-104 flex-col items-center justify-center rounded-2xl bg-[rgb(30,79,65)] bg-cover bg-center p-6 text-center bg-blend-multiply shadow-md shadow-black/30 dark:shadow-inner"
>
  <img src={Logo} alt="Logo of DRAP" class="w-4/5 max-w-136 md:-mb-8" />
  <div>
    <h1 class="mb-8 text-2xl font-black text-white md:text-4xl">
      Draft Ranking Automated Processor
    </h1>
    <div
      class="flex flex-col items-center justify-center gap-4 *:w-3/5 *:min-w-fit md:flex-row md:gap-2 *:md:w-auto"
    >
      <Button href={resolve('/dashboard/')} size="lg" class="h-12 px-6">
        <ArrowRightIcon class="size-5" />
        <span>Go to Dashboard</span>
      </Button>
      <Button href={resolve('/history/')} variant="secondary" size="lg" class="h-12 px-6">
        <ScrollTextIcon class="size-5" />
        <span>View Draft</span>
      </Button>
    </div>
  </div>
</div>
