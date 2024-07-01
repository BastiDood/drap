<script>
    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ user } = data);
</script>

<h1 class="h1">DRAP: Draft Ranking Automated Processor</h1>
{#if user === null}
    <a href="/oauth/login/" rel="external" class="variant-filled-primary btn">Sign in with Google</a>
{/if}
