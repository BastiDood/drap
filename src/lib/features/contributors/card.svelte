<script lang="ts" module>
  export interface Props {
    name: string;
    role?: string;
    avatar?: string;
    website?: string;
    email?: string;
    github?: string;
    linkedin?: string;
  }
</script>

<script lang="ts">
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import MailIcon from '@lucide/svelte/icons/mail';
  import { SvglGitHubLogo, SvglLinkedInLogo } from '@selemondev/svgl-svelte';

  import * as Avatar from '$lib/components/ui/avatar';
  import * as Card from '$lib/components/ui/card';
  import Link from '$lib/components/link.svelte';

  const { name, role, avatar, website, email, github, linkedin }: Props = $props();
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
    {#if typeof email !== 'undefined'}
      <Link
        href="mailto:{email}"
        target="_blank"
        rel="external"
        class="text-xs text-muted-foreground hover:underline"
      >
        <MailIcon class="size-5" />
      </Link>
    {/if}
    {#if typeof github !== 'undefined'}
      <Link
        href="https://github.com/{github}"
        target="_blank"
        rel="external"
        class="text-xs text-muted-foreground hover:underline"
      >
        <SvglGitHubLogo width={20} height={20} class="[&_path]:fill-current" />
      </Link>
    {/if}
    {#if typeof linkedin !== 'undefined'}
      <Link
        href="https://www.linkedin.com/in/{linkedin}/"
        target="_blank"
        rel="external"
        class="text-xs text-muted-foreground hover:underline"
      >
        <SvglLinkedInLogo width={20} height={20} class="[&_path]:fill-current" />
      </Link>
    {/if}
  </div>
</Card.Root>
