<script lang="ts">
  import { Button, Heading, Section, Text } from 'better-svelte-email';

  import { ORIGIN } from '$lib/env';
  import { resolve } from '$app/paths';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    draftId: number;
  }

  const { draftId }: Props = $props();
</script>

<EmailLayout preview="Draft #{draftId} has concluded - View final assignments">
  <Section>
    <Heading class="text-foreground text-2xl font-bold" as="h1">Draft Concluded</Heading>
    <Text class="text-base">
      Draft <strong class="text-foreground">#{draftId}</strong> has just concluded. All registered students
      have been assigned to their respective research labs.
    </Text>
    <Section class="bg-secondary/30 text-secondary-foreground my-6 rounded-lg">
      <Section class="mx-auto max-w-md">
        <Text class="text-sm">See the new roster of researchers through the lab module.</Text>
        <Button
          href="{ORIGIN}{resolve('/dashboard')}"
          target="_blank"
          pX={24}
          pY={12}
          class="bg-primary text-primary-foreground hover:bg-primary/90 mb-4 rounded-md font-medium"
        >
          Go to Dashboard
        </Button>
      </Section>
    </Section>
  </Section>
</EmailLayout>
