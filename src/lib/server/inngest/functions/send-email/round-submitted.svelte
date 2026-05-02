<script lang="ts">
  import { Heading, Section, Text } from '@better-svelte-email/components';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    labName: string;
    round: number;
    draftId: number;
    isCreate: boolean;
  }

  const { labName, round, draftId, isCreate }: Props = $props();
</script>

<EmailLayout
  preview={isCreate
    ? `${labName} submitted preferences for Round #${round}`
    : `${labName} updated preferences for Round #${round}`}
>
  <Section>
    <Section class="p-4">
      <Heading class="text-2xl font-bold text-foreground" as="h1">
        {isCreate ? 'Preferences Submitted' : 'Preferences Updated'}
      </Heading>
      <Text class="text-base text-foreground">
        The <strong>{labName}</strong>
        {isCreate ? 'has submitted' : 'has updated'}
        their student preferences for
        <strong>Round #{round}</strong> of Draft
        <strong>#{draftId}</strong>.
      </Text>
      {#if isCreate}
        <Text class="text-base">
          The draft will proceed to the next round once all participating labs have submitted their
          preferences.
        </Text>
      {/if}
    </Section>
  </Section>
</EmailLayout>
