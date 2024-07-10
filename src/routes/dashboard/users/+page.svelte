<script>
    import ListItem from './ListItem.svelte';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { PaperAirplane } from '@steeze-ui/heroicons';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import groupBy from 'just-group-by';

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
    const toast = getToastStore();
</script>

<h1 class="h1">Users</h1>
<div class="card space-y-4 p-4">
    <h2 class="h2">Lab Heads</h2>
    <form
        method="post"
        action="?/faculty"
        class="space-y-2"
        use:enhance={({ submitter }) => {
            assert(submitter !== null);
            assert(submitter instanceof HTMLButtonElement);
            submitter.disabled = true;
            return async ({ update, result }) => {
                submitter.disabled = false;
                await update();
                switch (result.type) {
                    case 'success':
                        toast.trigger({
                            message: 'Successfully invited a new laboratory head.',
                            background: 'variant-filled-success',
                        });
                        break;
                    case 'failure':
                        assert(result.status === 409);
                        toast.trigger({
                            message: 'User or invite already exists.',
                            background: 'variant-filled-error',
                        });
                        break;
                    default:
                        break;
                }
            };
        }}
    >
        <label>
            <span>Laboratory</span>
            <select required name="invite" class="variant-form-materal select">
                <option value="" disabled selected hidden>Send invite to...</option>
                {#each labs as { lab_id, lab_name } (lab_id)}
                    <option value={lab_id}>{lab_name}</option>
                {/each}
            </select>
        </label>
        <label>
            <span>Email</span>
            <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
                <div class="input-group-shim"><Icon src={PaperAirplane} class="size-6" /></div>
                <input type="email" required name="email" placeholder="example@up.edu.ph" class="px-4 py-2" />
                <button class="variant-filled-primary">Invite</button>
            </div>
        </label>
    </form>
    <div class="grid grid-cols-1 md:grid-cols-2">
        <nav class="list-nav space-y-2">
            <h3 class="h3">Invited</h3>
            <ul>
                {#each invitedHeads as head (head.email)}
                    <ListItem user={head} />
                {/each}
            </ul>
        </nav>
        <nav class="list-nav space-y-2">
            <h3 class="h3">Registered</h3>
            <ul>
                {#each registeredHeads as head (head.email)}
                    <ListItem user={head} />
                {/each}
            </ul>
        </nav>
    </div>
</div>
<div class="card space-y-4 p-4">
    <h2 class="h2">Draft Administrators</h2>
    <form
        method="post"
        action="?/admin"
        class="space-y-2"
        use:enhance={({ submitter }) => {
            assert(submitter !== null);
            assert(submitter instanceof HTMLButtonElement);
            submitter.disabled = true;
            return async ({ update, result }) => {
                submitter.disabled = false;
                await update();
                switch (result.type) {
                    case 'success':
                        toast.trigger({
                            message: 'Successfully invited a new draft administrator.',
                            background: 'variant-filled-success',
                        });
                        break;
                    case 'failure':
                        assert(result.status === 409);
                        toast.trigger({
                            message: 'User or invite already exists.',
                            background: 'variant-filled-error',
                        });
                        break;
                    default:
                        break;
                }
            };
        }}
    >
        <label>
            <span>Email</span>
            <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
                <div class="input-group-shim"><Icon src={PaperAirplane} class="size-6" /></div>
                <input type="email" required name="email" placeholder="example@up.edu.ph" class="px-4 py-2" />
                <button class="variant-filled-primary">Invite</button>
            </div>
        </label>
    </form>
    <div class="grid grid-cols-1 md:grid-cols-2">
        <nav class="list-nav space-y-2">
            <h3 class="h3">Invited</h3>
            <ul>
                {#each invitedAdmins as head (head.email)}
                    <ListItem user={head} />
                {/each}
            </ul>
        </nav>
        <nav class="list-nav space-y-2">
            <h3 class="h3">Registered</h3>
            <ul>
                {#each registeredAdmins as head (head.email)}
                    <ListItem user={head} />
                {/each}
            </ul>
        </nav>
    </div>
</div>
