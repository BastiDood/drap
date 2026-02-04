<script lang="ts">
  import { Body, Container, Head, Html, Img, Preview, Section, Text } from 'better-svelte-email';
  import type { Snippet } from 'svelte';

  import { ORIGIN } from '$lib/env';

  import ConfidentialityNotice from './confidentiality-notice.svelte';

  interface Props {
    preview: string;
    children: Snippet;
  }

  let { preview, children }: Props = $props();

  const logoUrl = `${ORIGIN}/drap-logo.png`;
</script>

<Html>
  <Head />
  <Body class="bg-stone-100">
    <Preview {preview} />
    <Container class="m-6 mx-auto max-w-2xl overflow-hidden rounded-xl bg-white shadow-sm">
      <Section class="bg-primary text-center">
        <Img src={logoUrl} alt="DRAP Logo" width="180" height="auto" class="mx-auto mt-4 block" />
        <Text class="text-primary-foreground mt-2 text-sm font-medium">
          Draft Ranking Automated Processor
        </Text>
      </Section>

      <Section class="mx-auto mt-4 max-w-xl">
        {@render children()}
      </Section>

      <Section class="bg-card">
        <ConfidentialityNotice />
      </Section>
    </Container>
  </Body>
</Html>
