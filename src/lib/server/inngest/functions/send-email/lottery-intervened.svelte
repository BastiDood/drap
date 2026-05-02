<script lang="ts">
  import { Column, Heading, Img, Row, Section, Text } from '@better-svelte-email/components';

  import EmailLayout from './email-layout.svelte';

  interface Props {
    studentName: string;
    studentEmail: string;
    avatarUrl: string;
    labName: string;
    draftId: number;
  }

  const { studentName, studentEmail, avatarUrl, labName, draftId }: Props = $props();
</script>

<EmailLayout preview="Manual assignment notification - Draft #{draftId}">
  <Section>
    <Section class="p-4">
      <Heading class="text-2xl font-bold text-foreground" as="h1"
        >Manual Assignment Completed</Heading
      >
      <Text class="text-sm text-muted-foreground">
        This assignment was made through administrative intervention during the lottery phase.
      </Text>
    </Section>
    <Section class="px-4 pb-4">
      <Section class="mx-auto max-w-md rounded-lg bg-card p-4 text-card-foreground">
        <Text class="font-semibold">Assignment Details</Text>
        <Row class="mt-3">
          <Column class="w-12 align-middle">
            {#if avatarUrl.length > 0}
              <Img
                src={avatarUrl}
                alt={studentName}
                width="36"
                height="36"
                class="block rounded-full bg-white object-cover"
              />
            {:else}
              <Section class="size-9 rounded-full bg-secondary text-center">
                <Text class="m-0 text-xs font-semibold text-secondary-foreground">
                  {studentName.trim()[0]?.toUpperCase() ?? '?'}
                </Text>
              </Section>
            {/if}
          </Column>
          <Column class="align-middle">
            <Text class="my-0 text-base leading-relaxed font-medium">{studentName}</Text>
            <Text class="my-0 text-xs leading-relaxed text-muted-foreground">{studentEmail}</Text>
          </Column>
        </Row>
        <Text class="mt-3 mb-0 text-base leading-relaxed">
          Assigned to:
          <strong>{labName}</strong>
        </Text>
      </Section>
    </Section>
  </Section>
</EmailLayout>
