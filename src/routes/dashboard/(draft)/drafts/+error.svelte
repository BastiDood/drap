<script>
    import { CalendarDays } from '@steeze-ui/heroicons';
    import ErrorAlert from '$lib/alerts/Error.svelte';
    import { Icon } from '@steeze-ui/svelte-icon';
    import { assert } from '$lib/assert';
    import { enhance } from '$app/forms';
    import { getToastStore } from '@skeletonlabs/skeleton';
    import { page } from '$app/stores';

    const toast = getToastStore();
    $: ({ status, error } = $page);
</script>

{#if status === 499}
    <form
        method="post"
        action="?/init"
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
{:else if error !== null}
    <ErrorAlert><strong>{status}:</strong> {error.message}</ErrorAlert>
{:else}
    <ErrorAlert><strong>{status}</strong></ErrorAlert>
{/if}
