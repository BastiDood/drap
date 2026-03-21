<script lang="ts" module>
  export interface Props {
    name: string;
    role?: string;
    avatar?: string;
    website?: string;
    github?: string;
  }
</script>

<script lang="ts">
  import GithubIcon from '@lucide/svelte/icons/github';
  import GlobeIcon from '@lucide/svelte/icons/globe';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import Link from '$lib/components/link.svelte';

  const { name, role, avatar, website, github }: Props = $props();
</script>

<Card.Root class="flex flex-col items-center gap-4 p-4 text-center">
  <Avatar.Root class="size-16">
    {#if typeof avatar !== 'undefined'}
      <Avatar.Image src={avatar} alt={name} />
    {/if}
  </Avatar.Root>
  <div>
    <Card.Title class="text-base font-semibold">{name}</Card.Title>
    {#if typeof role !== 'undefined'}
      <Card.Description class="mt-0.5 text-xs text-muted-foreground">{role}</Card.Description>
    {/if}
  </div>
  <div class="flex flex-wrap gap-2">
    {#if typeof website !== 'undefined'}
      <Link
        href={website}
        target="_blank"
        rel="external"
        class="text-xs text-muted-foreground hover:underline"
      >
        <GlobeIcon class="size-5" />
      </Link>
    {/if}
    {#if typeof github !== 'undefined'}
      <Link
        href="https://github.com/{github}"
        target="_blank"
        rel="external"
        class="text-xs text-muted-foreground hover:underline"
      >
        <GithubIcon class="size-5" />
      </Link>
    {/if}
  </div>
</Card.Root>
