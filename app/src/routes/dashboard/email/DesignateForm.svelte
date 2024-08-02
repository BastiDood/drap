<script lang="ts" context="module">
    import { ArrowDown, ArrowUp, XMark } from '@steeze-ui/heroicons';
    function useSenderControls(isActive: boolean) {
        return isActive
            ? (['demote', 'variant-filled-warning', 'variant-ghost-surface', 'Demote', ArrowDown] as const)
            : (['promote', 'variant-filled-success', 'variant-soft-surface', 'Promote', ArrowUp] as const);
    }
</script>

<script lang="ts">
    import { Avatar } from '@skeletonlabs/skeleton';
    import { Icon } from '@steeze-ui/svelte-icon';
    import type { QueriedCandidateSenders } from 'drap-database';
    import { enhance } from '$app/forms';

    // eslint-disable-next-line init-declarations
    export let senders: QueriedCandidateSenders;
    let disabled = false;
</script>

<dl class="list-dl">
    {#each senders as { email, given_name, family_name, avatar, is_active } (email)}
        {@const [action, variant, card, text, icon] = useSenderControls(is_active)}
        <div class="card {card} min-w-max">
            <span><Avatar slot="lead" src={avatar} width="w-12" /></span>
            <span class="flex-auto">
                <dt><strong><span class="uppercase">{family_name}</span>, {given_name}</strong></dt>
                <dd class="text-sm opacity-50">{email}</dd>
            </span>
            <span>
                <form
                    method="post"
                    class="flex gap-1"
                    use:enhance={() => {
                        disabled = true;
                        return async ({ update }) => {
                            disabled = false;
                            await update();
                        };
                    }}
                >
                    <input type="hidden" name="email" value={email} />
                    <button
                        type="submit"
                        {disabled}
                        formaction="/dashboard/email/?/{action}"
                        class="{variant} btn btn-sm"
                    >
                        <span><Icon src={icon} class="h-6" /></span>
                        <span>{text}</span>
                    </button>
                    <button
                        type="submit"
                        {disabled}
                        formaction="/dashboard/email/?/remove"
                        class="variant-filled-error btn btn-sm"
                    >
                        <span><Icon src={XMark} class="h-6" /></span>
                        <span>Remove</span>
                    </button>
                </form>
            </span>
        </div>
    {/each}
</dl>
