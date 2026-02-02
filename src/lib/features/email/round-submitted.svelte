<script lang="ts">
  import { Heading, Section, Text } from 'better-svelte-email';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    labName: string;
    round: number;
    draftId: number;
  }

  const {
    labName,
    round,
    draftId,
  }: Props = $props();
</script>

<EmailLayout preview="{labName} submitted preferences for Round #{round}">
  <Section>
    <Heading class="text-foreground text-2xl font-bold" as="h1">Preferences Submitted</Heading>

    <Text class="text-foreground text-base">
      The <strong>{labName}</strong> has submitted their student preferences
      for
      <strong>Round #{round}</strong> of Draft
      <strong>#{draftId}</strong>.
    </Text>

    <Text class="text-base">
      The draft will proceed to the next round once all participating labs have submitted their preferences.
    </Text>
  </Section>
</EmailLayout>
