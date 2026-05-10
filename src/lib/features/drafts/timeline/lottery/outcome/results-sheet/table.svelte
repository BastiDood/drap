<script lang="ts">
  import * as Table from '$lib/components/ui/table';
  import DesignatedLab from '$lib/users/designated-lab.svelte';
  import type { DraftAssignmentRecord } from '$lib/features/drafts/types';

  interface Props {
    assignments: DraftAssignmentRecord[];
  }

  const { assignments }: Props = $props();
</script>

<div class="min-h-0 grow overflow-y-auto rounded-sm">
  <Table.Root>
    <Table.Header>
      <Table.Row>
        <Table.Head>Student Number</Table.Head>
        <Table.Head>Name</Table.Head>
        <Table.Head>Email</Table.Head>
        <Table.Head>Assigned Lab</Table.Head>
      </Table.Row>
    </Table.Header>
    <Table.Body>
      {#each assignments as { id, studentNumber, familyName, givenName, email, labId } (id)}
        <Table.Row>
          <Table.Cell class="tabular-nums">
            {studentNumber ?? 'N/A'}
          </Table.Cell>
          <Table.Cell>{familyName.toUpperCase()}, {givenName}</Table.Cell>
          <Table.Cell>{email}</Table.Cell>
          <Table.Cell>
            <DesignatedLab {labId} />
          </Table.Cell>
        </Table.Row>
      {:else}
        <Table.Row>
          <Table.Cell colspan={4}>
            <p class="my-8 text-center text-sm text-muted-foreground">
              No lottery assignments were recorded.
            </p>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</div>
