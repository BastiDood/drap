<script>
    import { Icon } from '@steeze-ui/svelte-icon';
    import { ExclamationCircle as src } from '@steeze-ui/heroicons';
</script>

<div class="alert variant-soft-error flex flex-row items-center gap-x-2">
    <Icon {src} class="size-8" />
    <div class="!mt-0 contents">
        <slot />
    </div>
</div>
