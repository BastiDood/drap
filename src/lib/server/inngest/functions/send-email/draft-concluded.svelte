<script lang="ts">
  import { Button, Heading, Section, Text } from 'better-svelte-email';

  import { ORIGIN } from '$lib/env';

  import EmailLayout from './email-layout.svelte';

  interface LotteryAssignment {
    labId: string;
    labName: string;
    studentName: string;
    studentEmail: string;
  }

  interface GroupedLotteryAssignment {
    labId: string;
    labName: string;
    students: Pick<LotteryAssignment, 'studentName' | 'studentEmail'>[];
  }

  interface Props {
    draftId: number;
    lotteryAssignments: LotteryAssignment[];
  }

  const { draftId, lotteryAssignments }: Props = $props();
  const groupedLotteryAssignments = $derived.by(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local grouping container in derived computation
    const grouped = new Map<string, GroupedLotteryAssignment>();
    for (const { labId, labName, studentName, studentEmail } of lotteryAssignments) {
      const existing = grouped.get(labId);
      if (typeof existing === 'undefined') {
        grouped.set(labId, {
          labId,
          labName,
          students: [{ studentName, studentEmail }],
        });
        continue;
      }
      existing.students.push({ studentName, studentEmail });
    }
    return Array.from(grouped.values()).sort((left, right) =>
      left.labId.localeCompare(right.labId),
    );
  });
</script>

<EmailLayout preview="Draft #{draftId} has concluded - View final assignments">
  <Section>
    <Heading class="text-foreground text-2xl font-bold" as="h1">Draft Concluded</Heading>
    <Text class="text-base">
      Draft <strong class="text-foreground">#{draftId}</strong> has just concluded. All registered students
      have been assigned to their respective research labs.
    </Text>
    {#if groupedLotteryAssignments.length > 0}
      <Section class="bg-card text-card-foreground my-6 rounded-lg">
        <Section class="mx-auto max-w-md py-4">
          <Heading class="text-foreground text-lg font-semibold" as="h2">
            Finalized Lottery Results
          </Heading>
          {#each groupedLotteryAssignments as group (group.labId)}
            <Section class="border-muted my-3 rounded-md border px-3 py-2">
              <Text class="mb-2 text-sm font-semibold">{group.labName}</Text>
              {#each group.students as student (`${group.labId}:${student.studentEmail}`)}
                <Text class="my-0 text-sm leading-relaxed">
                  <a href="mailto:{student.studentEmail}">{student.studentName}</a>
                </Text>
              {/each}
            </Section>
          {/each}
        </Section>
      </Section>
    {/if}
    <Section class="bg-secondary/30 text-secondary-foreground my-6 rounded-lg">
      <Section class="mx-auto max-w-md">
        <Text class="text-sm">See the new roster of researchers through the lab module.</Text>
        <Button
          href="{ORIGIN}/dashboard/"
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
