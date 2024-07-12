<script>
    import { CalendarDays } from '@steeze-ui/heroicons';
    import ErrorAlert from '$lib/alerts/Error.svelte';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { page } from '$app/stores';
    import { validateString } from '$lib/forms';

    const toast = getToastStore();
    $: ({ status, error } = $page);
</script>

{#if status === 499}
    <!-- TODO: Add reminder about setting the lab quota. -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <div class="prose dark:prose-invert">
            <h2>Start a New Draft</h2>
            <p>
                Welcome to the <strong>Draft Ranking Automated Processor</strong>! There are currently no drafts
                happening at the moment, but as an administrator, you have the authorization to start a new one.
            </p>
            <p>
                To begin, simply provide the the maximum number of rounds for the upcoming draft. This has historically
                been set to <strong>5</strong>.
            </p>
        </div>
        <form
            method="post"
            action="?/init"
            class="min-w-max"
            use:enhance={({ formData, submitter, cancel }) => {
                const rounds = parseInt(validateString(formData.get('rounds')), 10);
                if (!confirm(`Are you sure you want to start a new draft with ${rounds} rounds?`)) {
                    cancel();
                    return;
                }
                assert(submitter !== null);
                assert(submitter instanceof HTMLButtonElement);
                submitter.disabled = true;
                return async ({ update, result }) => {
                    submitter.disabled = false;
                    await update();
                    switch (result.type) {
                        case 'success':
                            toast.trigger({
                                message: 'Successfully started a new draft.',
                                background: 'variant-filled-success',
                            });
                            break;
                        case 'failure':
                            toast.trigger({
                                message: 'Failed to start a new draft.',
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
                <span>Number of Rounds</span>
                <div class="input-group input-group-divider grid-cols-[auto_1fr_auto]">
                    <div class="input-group-shim"><Icon src={CalendarDays} class="size-6" /></div>
                    <input type="number" min="1" required name="rounds" placeholder="5" class="px-4 py-2" />
                    <button class="variant-filled-primary">Start</button>
                </div>
            </label>
        </form>
    </div>
{:else if error !== null}
    <ErrorAlert><strong>{status}:</strong> {error.message}</ErrorAlert>
{:else}
    <ErrorAlert><strong>{status}</strong></ErrorAlert>
{/if}
