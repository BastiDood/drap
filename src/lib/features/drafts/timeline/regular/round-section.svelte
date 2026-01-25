<script lang="ts">
  import * as Accordion from '$lib/components/ui/accordion';

  import type { Lab, Student } from '$lib/features/drafts/types';

  import LabAccordionItem from './lab-accordion-item.svelte';

  interface Props {
    round: number;
    labs: Lab[];
    available: Student[];
    selected: Student[];
  }

  const { round, labs, available, selected }: Props = $props();
</script>

<div class="space-y-2">
  <div class="prose dark:prose-invert">
    <h4>Round {round}</h4>
  </div>
  <Accordion.Root type="multiple">
    {#each labs as lab (lab.id)}
      <LabAccordionItem {lab} {round} {available} {selected} />
    {/each}
  </Accordion.Root>
</div>
