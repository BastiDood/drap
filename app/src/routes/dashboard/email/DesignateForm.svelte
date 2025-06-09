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
    import { enhance } from '$app/forms';
    import type { schema } from '$lib/server/database';

    interface Props extends Pick<schema.User, 'email' | 'givenName' | 'familyName' | 'avatarUrl'> {
        isActive: boolean;
    }

    // eslint-disable-next-line init-declarations
    export let senders: Props[];
    let disabled = false;
</script>

<dl class="list-dl">
    {#each senders as { email, givenName, familyName, avatarUrl, isActive } (email)}
        {@const [action, variant, card, text, icon] = useSenderControls(isActive)}
        <div class="card {card} min-w-max">
            <span><Avatar slot="lead" src={avatarUrl} width="w-12" /></span>
            <span class="flex-auto">
                <dt><strong><span class="uppercase">{familyName}</span>, {givenName}</strong></dt>
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
