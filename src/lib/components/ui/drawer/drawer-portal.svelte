<script lang="ts">
  import { Drawer as DrawerPrimitive } from 'vaul-svelte';

  const restProps: DrawerPrimitive.PortalProps = $props();
</script>

<DrawerPrimitive.Portal {...restProps} />
