<script>
    import ProfileForm from './ProfileForm.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        user: { studentNumber, givenName, familyName },
    } = data);
</script>

<h1 class="h1">User Profile</h1>
{#if studentNumber === null}
    <WarningAlert>The student number must be set. Note that this can only be done once.</WarningAlert>
{/if}
<ProfileForm {studentNumber} {givenName} {familyName} />
