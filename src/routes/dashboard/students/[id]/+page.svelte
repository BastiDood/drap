<script lang="ts">
    import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
    import { enhance } from '$app/forms';

    // TODO: Replace dummy data with actual list of students.
    const students = [
        { name: 'Victor Edwin Reyes', id: 202100000n, email: 'vereyes2@up.edu.ph' },
        { name: 'Sebastian Luis Ortiz', id: 202000000n, email: 'ssortiz@up.edu.ph' },
        { name: 'Angelica Julianne Raborar', id: 202000001n, email: 'aaaborar@up.edu.ph' },
    ];

    let draftees: string[] = [];
</script>

<section class="space-y-4">
    <h1 class="h1">Draftee Select</h1>
    <form method="post" use:enhance class="space-y-4">
        <ListBox multiple rounded="rounded">
            {#each students as { id, name, email } (id)}
                <ListBoxItem bind:group={draftees} name="students" value={id}>
                    <div class="p-1">
                        <p>{name}</p>
                        <p>{id}</p>
                        <p>{email}</p>
                    </div>
                </ListBoxItem>
            {/each}
        </ListBox>
        <!-- TODO: Set up form actions. -->
        <button type="submit" class="variant-filled-success btn">Save Selection</button>
    </form>
</section>
