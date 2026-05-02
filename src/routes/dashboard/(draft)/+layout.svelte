<script lang="ts">
  import Callout from '$lib/components/callout.svelte';
  import Link from '$lib/components/link.svelte';
  import { resolve } from '$app/paths';

  const { data, children } = $props();
  const { candidateSenders } = $derived(data);
  const designatedSender = $derived(candidateSenders.find(({ isActive }) => isActive));
  const adminsHref = `${resolve('/dashboard/users/')}#draft-admins`;
</script>

<div class="space-y-4">
  {#if typeof designatedSender === 'undefined'}
    {#if candidateSenders.length === 0}
      <Callout variant="destructive"
        ><span
          >No candidate email senders have been added yet. Please <Link href={adminsHref}
            >volunteer a candidate sender</Link
          > on the user management page before starting a new draft.</span
        >
      </Callout>
    {:else}
      <Callout variant="warning"
        ><span
          >No designated email senders have been assigned yet. Please <Link href={adminsHref}
            >promote a designated sender</Link
          > on the user management page before starting a new draft.</span
        >
      </Callout>
    {/if}
  {:else}
    <Callout variant="info">
      <span
        ><Link href="mailto:{designatedSender.email}"
          >{designatedSender.givenName} {designatedSender.familyName}</Link
        > is the currently designated email sender. <Link href={adminsHref}
          >You may update the configuration here.</Link
        ></span
      >
    </Callout>
  {/if}
  {@render children?.()}
</div>
