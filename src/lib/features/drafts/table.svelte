<script lang="ts">
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import { format } from 'date-fns';

  import * as Table from '$lib/components/ui/table';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';

  import type { Draft } from './types';

  type Status = 'registration' | 'regular' | 'lottery' | 'concluded';

  interface Props {
    drafts: Draft[];
  }

  const { drafts }: Props = $props();

  function getStatus(draft: Draft): Status {
    if (draft.activePeriodEnd !== null) return 'concluded';
    if (draft.currRound === null) return 'lottery';
    if (draft.currRound === 0) return 'registration';
    return 'regular';
  }

  function getStatusLabel(status: Status): string {
    switch (status) {
      case 'registration':
        return 'Registration';
      case 'regular':
        return 'In Progress';
      case 'lottery':
        return 'Lottery';
      case 'concluded':
        return 'Concluded';
      default:
        throw new Error('unreachable');
    }
  }

  function getStatusVariant(status: Status) {
    switch (status) {
      case 'registration':
      case 'concluded':
        return 'secondary';
      case 'regular':
        return 'default';
      case 'lottery':
        return 'outline';
      default:
        throw new Error('unreachable');
    }
  }
</script>

<Table.Root>
  <Table.Header>
    <Table.Row>
      <Table.Head class="w-20">ID</Table.Head>
      <Table.Head>Status</Table.Head>
      <Table.Head>Started</Table.Head>
      <Table.Head>Ended</Table.Head>
      <Table.Head>Rounds</Table.Head>
      <Table.Head class="text-right">Actions</Table.Head>
    </Table.Row>
  </Table.Header>
  <Table.Body>
    {#each drafts as draft (draft.id)}
      {@const status = getStatus(draft)}
      <Table.Row>
        <Table.Cell class="font-mono">#{draft.id.toString()}</Table.Cell>
        <Table.Cell>
          <Badge variant={getStatusVariant(status)}>{getStatusLabel(status)}</Badge>
          {#if status === 'regular' && draft.currRound !== null}
            <span class="text-muted-foreground ml-1 text-xs">
              Round {draft.currRound}/{draft.maxRounds}
            </span>
          {/if}
        </Table.Cell>
        <Table.Cell>
          <span class="text-sm">{format(draft.activePeriodStart, 'PPP')}</span>
          <span class="text-muted-foreground block text-xs">
            {format(draft.activePeriodStart, 'p')}
          </span>
        </Table.Cell>
        <Table.Cell>
          {#if draft.activePeriodEnd !== null}
            <span class="text-sm">{format(draft.activePeriodEnd, 'PPP')}</span>
            <span class="text-muted-foreground block text-xs">
              {format(draft.activePeriodEnd, 'p')}
            </span>
          {:else}
            <span class="text-muted-foreground text-sm">Ongoing</span>
          {/if}
        </Table.Cell>
        <Table.Cell>
          <span class="font-mono text-sm">{draft.maxRounds}</span>
        </Table.Cell>
        <Table.Cell class="text-right">
          <Button href="/dashboard/drafts/{draft.id}/" variant="accent" size="sm">
            <ExternalLinkIcon class="size-4" />
            <span>View</span>
          </Button>
        </Table.Cell>
      </Table.Row>
    {:else}
      <Table.Row>
        <Table.Cell colspan={6} class="text-muted-foreground py-8 text-center">
          No drafts found. Create one to get started.
        </Table.Cell>
      </Table.Row>
    {/each}
  </Table.Body>
</Table.Root>
