<script>
    import { Google } from '@steeze-ui/simple-icons';
    import { Icon } from '@steeze-ui/svelte-icon';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ user } = data);
</script>

<h1 class="h1">DRAP: Draft Ranking Automated Processor</h1>
{#if user === null}
    <a href="/oauth/login/" rel="external" class="variant-filled-primary btn">
        <Icon src={Google} class="size-4" />
        <span>Sign in with Google</span>
    </a>
{/if}
