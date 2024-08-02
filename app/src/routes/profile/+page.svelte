<script>
    import ProfileForm from './ProfileForm.svelte';
    import WarningAlert from '$lib/alerts/Warning.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({
        user: { student_number, given_name, family_name },
    } = data);
</script>

<h1 class="h1">User Profile</h1>
{#if student_number === null}
    <WarningAlert>The student number must be set. Note that this can only be done once.</WarningAlert>
{/if}
<ProfileForm studentNumber={student_number} givenName={given_name} familyName={family_name} />
