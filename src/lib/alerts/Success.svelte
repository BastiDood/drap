<script>
    import { Icon } from '@steeze-ui/svelte-icon';
    import { CheckCircle as src } from '@steeze-ui/heroicons';
</script>

<div class="alert variant-soft-success flex flex-row items-center gap-x-2">
    <Icon {src} class="h-8 w-8" />
    <div class="!mt-0 contents">
        <slot />
    </div>
</div>
