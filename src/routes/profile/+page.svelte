<script lang="ts">
  import ProfileForm from './ProfileForm.svelte';
  import WarningAlert from '$lib/alerts/Warning.svelte';

  const { data } = $props();
  const {
    user: { studentNumber, givenName, familyName },
  } = $derived(data);
</script>

<h1 class="h1">User Profile</h1>
{#if studentNumber === null}
  <WarningAlert>The student number must be set. Note that this can only be done once.</WarningAlert>
{/if}
<ProfileForm {studentNumber} {givenName} {familyName} />
