<script lang="ts">
  import { type ChartConfig, THEMES } from './chart-utils';

  interface Props {
    id: string;
    config: ChartConfig;
  }

  const { id, config }: Props = $props();

  const colorConfig = $derived(
    config ? Object.entries(config).filter(([, config]) => config.theme || config.color) : null,
  );

  const themeContents = $derived.by(() => {
    if (colorConfig === null || colorConfig.length === 0) return;
    const themeContents = [];
    for (const [themeKey, prefix] of Object.entries(THEMES)) {
      let content = `${prefix} [data-chart="${id}"] {\n`;
      const color = colorConfig.map(([key, itemConfig]) => {
        const theme = themeKey as keyof typeof itemConfig.theme;
        const color = itemConfig.theme?.[theme] || itemConfig.color;
        return color ? `\t--color-${key}: ${color};` : null;
      });
      content += `${color.join('\n')}\n}`;
      themeContents.push(content);
    }
    return themeContents.join('\n');
  });
</script>

{#if themeContents}
  {#key id}
    <svelte:element this={"style"}>
      {themeContents}
    </svelte:element>
  {/key}
{/if}
