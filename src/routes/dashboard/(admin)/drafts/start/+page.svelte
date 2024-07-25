<script>
    import { assert } from '$lib/assert';
    import Student from '$lib/users/Student.svelte';
    import StartForm from './StartForm.svelte';

    // eslint-disable-next-line init-declarations
    export let data;

    const { available, draft } = data;

    assert(available && draft)
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
    <div class="space-y-4">
        <section class="prose dark:prose-invert">
            <h2>Registered Students</h2>
            <p>
                There are currently <strong>{available.length}</strong> students who have registered for this
                draft. Press the <strong>"Start Draft"</strong> button to close registration and start the draft
                automation.
            </p>
            <p>
                Lab heads will be notified when the first round begins. The draft proceeds to the next round
                when all lab heads have submitted their preferences. This process repeats until the configured
                maximum number of rounds has elapsed, after which the draft pauses until an administrator <em
                    >manually</em
                > proceeds with the lottery stage.
            </p>
        </section>
        <StartForm draft={draft.draft_id} />
    </div>
    <nav class="list-nav w-full">
        <ul class="list">
            {#each available as user (user.email)}
                <li><Student {user} /></li>
            {/each}
        </ul>
    </nav>
</div>