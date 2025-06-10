<script>
  import { Icon } from '@steeze-ui/svelte-icon';
  import { CheckCircle as src } from '@steeze-ui/heroicons';
</script>

<div class="alert variant-soft-success">
  <Icon {src} class="size-8" />
  <div class="alert-message"><slot /></div>
</div>
