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
  } from 'better-svelte-email';
  import type { Snippet } from 'svelte';

  import ConfidentialityNotice from './confidentiality-notice.svelte';

  interface Props {
    preview: string;
    children: Snippet;
  }

  let { preview, children }: Props = $props();
</script>

<Html>
  <Head />
  <Body class="bg-stone-100">
    <Preview {preview} />
    <Container class="m-6 mx-auto max-w-2xl rounded-xl bg-white shadow-sm overflow-hidden">
      <Section class="bg-primary text-center">
        <Img
          src=""
          alt="DRAP Logo"
          width="200"
          height="auto"
          class="mx-auto block mt-4"
        />
        <Text class="text-primary-foreground mt-2 text-sm font-medium">
          Draft Ranking Automated Processor
        </Text>
      </Section>

      <Section class="mx-auto max-w-xl mt-4">
        {@render children()}
      </Section>

      <Section class="bg-card">
        <ConfidentialityNotice />
      </Section>
    </Container>
  </Body>
</Html>
