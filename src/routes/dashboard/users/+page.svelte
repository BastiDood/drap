<script lang="ts">
  import groupBy from 'just-group-by';

  import * as Card from '$lib/components/ui/card';

  import AdminForm from './admin-form.svelte';
  import FacultyForm from './faculty-form.svelte';
  import InvitedVersusRegistered from './invited-versus-registered.svelte';

  const { data } = $props();
  const { labs, faculty } = $derived(data);
  const users = $derived(
    groupBy(faculty, ({ googleUserId, labName }) => {
      const isAdmin = labName === null;
      if (googleUserId === null) return isAdmin ? 'invitedAdmins' : 'invitedHeads';
      return isAdmin ? 'registeredAdmins' : 'registeredHeads';
    }),
  );
  const invitedAdmins = $derived(users.invitedAdmins ?? []);
  const invitedHeads = $derived(users.invitedHeads ?? []);
  const registeredAdmins = $derived(users.registeredAdmins ?? []);
  const registeredHeads = $derived(users.registeredHeads ?? []);
</script>

<h2 class="scroll-m-20 text-3xl font-semibold tracking-tight">Users</h2>
<Card.Root>
  <Card.Header>
    <Card.Title>Lab Heads</Card.Title>
  </Card.Header>
  <Card.Content class="space-y-4">
    <FacultyForm {labs} />
    <InvitedVersusRegistered invited={invitedHeads} registered={registeredHeads} />
  </Card.Content>
</Card.Root>
<Card.Root>
  <Card.Header>
    <Card.Title>Draft Administrators</Card.Title>
  </Card.Header>
  <Card.Content class="space-y-4">
    <AdminForm />
    <InvitedVersusRegistered invited={invitedAdmins} registered={registeredAdmins} />
  </Card.Content>
</Card.Root>
