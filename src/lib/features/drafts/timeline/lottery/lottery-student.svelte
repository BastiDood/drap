<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
  import * as NativeSelect from '$lib/components/ui/native-select';

  import type { Lab, Student } from '$lib/features/drafts/types';

  interface Props {
    labs: Pick<Lab, 'id' | 'name'>[];
    user: Student;
  }

  const { labs, user }: Props = $props();
  const { id, email, givenName, familyName, avatarUrl, studentNumber } = $derived(user);
</script>

<span>
  <Avatar.Root class="size-20">
    <Avatar.Image src={avatarUrl} alt="{givenName} {familyName}" />
    <Avatar.Fallback>{givenName[0]}{familyName[0]}</Avatar.Fallback>
  </Avatar.Root>
</span>
<span class="flex w-full flex-col">
  <strong class="text-sm"><span class="uppercase">{familyName}</span>, {givenName}</strong>
  {#if studentNumber !== null}
    <span class="text-xs opacity-50">{studentNumber}</span>
  {/if}
  <span class="text-xs opacity-50">{email}</span>
  <NativeSelect.Root name={id}>
    <NativeSelect.Option value="" selected>[Undrafted]</NativeSelect.Option>
    {#each labs as { id, name } (id)}
      <NativeSelect.Option value={id}>{name}</NativeSelect.Option>
    {/each}
  </NativeSelect.Root>
</span>
