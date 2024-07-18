<script lang="ts">
    import DesignateForm from './DesignateForm.svelte';
    import ErrorAlert from '$lib/alerts/Error.svelte';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { ShieldExclamation } from '@steeze-ui/heroicons';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        senders,
        user: { email },
    } = data);
</script>

{#if senders.length > 0}
    <DesignateForm {senders} />
{:else}
    <ErrorAlert>There are no candidate email senders yet.</ErrorAlert>
{/if}
{#if typeof senders.find(({ email: other }) => other === email) === 'undefined'}
    <a href="/oauth/login/?extended" class="variant-filled-primary btn btn-lg w-full">
        <span><Icon src={ShieldExclamation} class="h-12" /></span>
        <span>Volunteer as a Candidate Sender</span>
    </a>
{/if}
