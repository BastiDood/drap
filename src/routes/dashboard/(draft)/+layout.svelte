<script lang="ts">
  import Callout from '$lib/components/callout.svelte';
  import Link from '$lib/components/link.svelte';
  import { resolve } from '$app/paths';

  const { data, children } = $props();
  const { candidateSenders } = $derived(data);
  const designatedSender = $derived(candidateSenders.find(({ isActive }) => isActive));
  const emailSettingsHref = resolve('/dashboard/email/');
</script>

<div class="space-y-4">
  {#if typeof designatedSender === 'undefined'}
    {#if candidateSenders.length === 0}
      <Callout variant="destructive"
        >No candidate email senders have been added yet. Please <Link href={emailSettingsHref}
          >nominate a candidate sender</Link
        > before starting a new draft.
      </Callout>
    {:else}
      <Callout variant="warning"
        >No designated email senders have been assigned yet. Please <Link href={emailSettingsHref}
          >promote a designated sender</Link
        > before starting a new draft.
      </Callout>
    {/if}
  {:else}
    <Callout variant="info">
      <Link href="mailto:{designatedSender.email}"
        >{designatedSender.givenName} {designatedSender.familyName}</Link
      > is the currently designated email sender. <Link href={emailSettingsHref}
        >You may update the configuration here.</Link
      >
    </Callout>
  {/if}
  {@render children?.()}
</div>
