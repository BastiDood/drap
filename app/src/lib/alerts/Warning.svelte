<script>
    import { Icon } from '@steeze-ui/svelte-icon';
    import { ExclamationTriangle as src } from '@steeze-ui/heroicons';
</script>

<div class="alert variant-soft-warning">
    <span><Icon {src} class="w-8" /></span>
    <div class="alert-message"><slot /></div>
</div>
