<script>
    import InvitedVersusRegistered from './InvitedVersusRegistered.svelte';
    import groupBy from 'just-group-by';

    import AdminForm from './AdminForm.svelte';
    import FacultyForm from './FacultyForm.svelte';

    // eslint-disable-next-line init-declarations
    export let data;
    $: ({ labs, faculty } = data);
    $: users = groupBy(faculty, ({ user_id, lab_name }) => {
        const isAdmin = lab_name === null;
        if (user_id === null) return isAdmin ? 'invitedAdmins' : 'invitedHeads';
        return isAdmin ? 'registeredAdmins' : 'registeredHeads';
    });
    $: invitedAdmins = users.invitedAdmins ?? [];
    $: invitedHeads = users.invitedHeads ?? [];
    $: registeredAdmins = users.registeredAdmins ?? [];
    $: registeredHeads = users.registeredHeads ?? [];
</script>

<h2 class="h2">Users</h2>
<div class="card space-y-4 p-4">
    <h3 class="h3">Lab Heads</h3>
    <FacultyForm {labs} />
    <InvitedVersusRegistered invited={invitedHeads} registered={registeredHeads} />
</div>
<div class="card space-y-4 p-4">
    <h3 class="h3">Draft Administrators</h3>
    <AdminForm />
    <InvitedVersusRegistered invited={invitedAdmins} registered={registeredAdmins} />
</div>
