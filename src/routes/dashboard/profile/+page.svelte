<script lang="ts">
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

  import * as Alert from '$lib/components/ui/alert';

  import ProfileForm from './profile-form.svelte';

  const { data } = $props();
  const {
    user: { studentNumber, givenName, familyName },
  } = $derived(data);
</script>

<h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight">User Profile</h1>
{#if studentNumber === null}
  <Alert.Root variant="warning">
    <TriangleAlert />
    <Alert.Description
      >The student number must be set. Note that this can only be done once.</Alert.Description
    >
  </Alert.Root>
{/if}
<ProfileForm {studentNumber} {givenName} {familyName} />
