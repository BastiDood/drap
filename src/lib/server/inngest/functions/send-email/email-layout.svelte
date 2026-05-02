<script lang="ts">
  import {
    Body,
    Container,
    Head,
    Html,
    Img,
    Preview,
    Section,
    Text,
  } from '@better-svelte-email/components';
  import type { Snippet } from 'svelte';

  import { ORIGIN } from '$lib/env';

  import ConfidentialityNotice from './confidentiality-notice.svelte';

  interface Props {
    preview: string;
    children: Snippet;
  }

  const { preview, children }: Props = $props();
</script>

<Html>
  <Head />
  <Body class="bg-stone-100">
    <Preview {preview} />
    <Container class="m-6 mx-auto max-w-2xl overflow-hidden rounded-xl bg-white shadow-sm">
      <Section class="bg-primary py-6 text-center">
        <Img
          src="{ORIGIN}/drap-logo.png"
          alt="DRAP Logo"
          width="180"
          height="90"
          class="mx-auto mt-4 block"
        />
        <Text class="mt-2 text-sm font-medium text-primary-foreground">
          Draft Ranking Automated Processor
        </Text>
      </Section>

      <Section class="mx-auto max-w-xl">
        {@render children()}
      </Section>

      <Section class="bg-card p-6">
        <ConfidentialityNotice />
      </Section>
    </Container>
  </Body>
</Html>
