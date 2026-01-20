<script>
  import CircleUser from '@lucide/svelte/icons/circle-user';

  import DCS from '$lib/assets/dcs.webp?url';
  import Logo from '$lib/assets/logo-DRAP-colored.svg';
</script>

<div
  class="m-6 mt-6 flex h-104 flex-col items-center rounded-2xl bg-[rgb(30,79,65)] text-center bg-blend-multiply"
  style="background-image: url({DCS})"
>
  <img src={Logo} alt="Logo of DRAP" class="-mb-8 size-2/3" />
  <div class="mb-8">
    <h1 class="text-foreground">Draft Ranking Automated Processor</h1>
    <a href="/oauth/login/" rel="external" class="btn btn-xl preset-filled-primary-500">
      <CircleUser />
      <span> Sign in with UP Mail </span>
    </a>
  </div>
</div>
