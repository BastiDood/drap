<script lang="ts">
  import CircleHelpIcon from '@lucide/svelte/icons/circle-help';

  import * as Card from '$lib/components/ui/card';
  import * as Popover from '$lib/components/ui/popover';

  interface Props {
    quota: number;
    remainingQuota: number;
    draftedCount: number;
    submissionSource?: 'faculty' | 'system' | undefined;
    autoAcknowledgeReason?: 'quota-exhausted' | 'no-preferences' | undefined;
  }

  const { quota, remainingQuota, draftedCount, submissionSource, autoAcknowledgeReason }: Props =
    $props();

  const remainingTonal = $derived.by(() => {
    if (submissionSource === 'faculty') return 'preset-tonal-muted';
    switch (autoAcknowledgeReason) {
      case 'quota-exhausted':
        return 'preset-tonal-destructive';
      case 'no-preferences':
        return 'preset-tonal-muted';
      default:
        return remainingQuota > 0 ? 'preset-tonal-success' : 'preset-tonal-warning';
    }
  });
</script>

<div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
  <Card.Root variant="soft" class="preset-tonal-muted">
    <Card.Header>
      <Card.Title class="flex items-center gap-1.5">
        Total Quota
        <Popover.Root>
          <Popover.Trigger>
            <CircleHelpIcon class="text-muted-foreground size-3.5" />
          </Popover.Trigger>
          <Popover.Content class="text-sm">
            Total slots allocated to your lab for this draft.
          </Popover.Content>
        </Popover.Root>
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <p id="stat-total-quota" class="text-2xl font-semibold tabular-nums">{quota}</p>
    </Card.Content>
  </Card.Root>
  <Card.Root variant="soft" class={remainingTonal}>
    <Card.Header>
      <Card.Title class="flex items-center gap-1.5">
        Remaining This Round
        <Popover.Root>
          <Popover.Trigger>
            <CircleHelpIcon class="text-muted-foreground size-3.5" />
          </Popover.Trigger>
          <Popover.Content class="text-sm">
            Slots you can still fill. You're not required to exhaust your allocation this round.
          </Popover.Content>
        </Popover.Root>
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <p id="stat-remaining" class="text-2xl font-semibold tabular-nums">{remainingQuota}</p>
    </Card.Content>
  </Card.Root>
  <Card.Root variant="soft" class="preset-tonal-accent col-span-2 sm:col-span-1">
    <Card.Header>
      <Card.Title class="flex items-center gap-1.5">
        Drafted So Far
        <Popover.Root>
          <Popover.Trigger>
            <CircleHelpIcon class="text-muted-foreground size-3.5" />
          </Popover.Trigger>
          <Popover.Content class="text-sm">
            Students your lab selected in previous rounds.
          </Popover.Content>
        </Popover.Root>
      </Card.Title>
    </Card.Header>
    <Card.Content>
      <p id="stat-drafted" class="text-2xl font-semibold tabular-nums">{draftedCount}</p>
    </Card.Content>
  </Card.Root>
</div>
