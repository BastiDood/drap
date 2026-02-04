<script lang="ts">
  import { Button, Heading, Section, Text } from 'better-svelte-email';

  import { ORIGIN } from '$lib/env';
  import { resolve } from '$app/paths';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    draftId: number;
    round: number | null;
  }

  const { draftId, round }: Props = $props();
</script>

<EmailLayout
  preview={round === null
    ? `Lottery round started - Draft #${draftId}`
    : `Round #${round} started - Draft #${draftId}`}
>
  <Section>
    <Heading class="text-foreground text-2xl font-bold" as="h1">
      {#if round === null}
        DRAP Lottery Round Started
      {:else}
        DRAP Round #{round} Started
      {/if}
    </Heading>
    <Text class="text-base">Hello,</Text>
    {#if round === null}
      <Text class="text-base">
        The <strong>lottery round</strong> for Draft <strong>#{draftId}</strong> has begun.
      </Text>
      <Section class="bg-secondary/30 text-secondary-foreground my-6 rounded-lg">
        <Section class="mx-auto max-w-md">
          <Text class="font-semibold">Action Required for Lab Heads</Text>
          <Text class="text-sm">
            Please coordinate with the draft administrators for the next steps.
          </Text>
        </Section>
      </Section>
    {:else}
      <Text class="text-base">
        <strong>Round #{round}</strong> for Draft <strong>#{draftId}</strong> has begun.
      </Text>
      <Section class="bg-secondary/30 text-secondary-foreground my-6 rounded-lg">
        <Section class="mx-auto max-w-md">
          <Text class="font-semibold">Action Required for Lab Heads</Text>
          <Text class="text-sm">
            Kindly check the students module to see the list of students who have chosen your lab.
          </Text>
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
    {/if}
  </Section>
</EmailLayout>
