<script lang="ts">
  import * as NativeSelect from '$lib/components/ui/native-select';

  import type { Lab } from '$lib/features/drafts/types';

  interface Props {
    labs: Pick<Lab, 'id' | 'name'>[];
    studentId: string;
  }

  const { labs, studentId }: Props = $props();
</script>

<NativeSelect.Root name={studentId}>
  <NativeSelect.Option value="" selected>[Undrafted]</NativeSelect.Option>
  {#each labs as { id, name } (id)}
    <NativeSelect.Option value={id}>{name}</NativeSelect.Option>
  {/each}
</NativeSelect.Root>