<script lang="ts">
  import ArrowUpFromLineIcon from '@lucide/svelte/icons/arrow-up-from-line';
  import FileChartColumnIcon from '@lucide/svelte/icons/file-chart-column';
  import LogsIcon from '@lucide/svelte/icons/logs';
  import { lightFormat } from 'date-fns';
  import type { LucideIcon } from '@lucide/svelte';

  import { Button } from '$lib/components/ui/button';
  import { resolve } from '$app/paths';

  import { ExportCsvButtonVariant } from './variant';

  interface Props {
    draftId: string;
    variant: ExportCsvButtonVariant;
    requestedAt: Date;
  }

  const { draftId, requestedAt, variant }: Props = $props();

  const metadata = $derived.by(() => {
    let icon: LucideIcon;
    let label: string;
    switch (variant) {
      case ExportCsvButtonVariant.Students:
        icon = ArrowUpFromLineIcon;
        label = 'Student Ranks';
        break;
      case ExportCsvButtonVariant.Results:
        icon = FileChartColumnIcon;
        label = 'Results';
        break;
      case ExportCsvButtonVariant.SystemLogs:
        icon = LogsIcon;
        label = 'System Logs';
        break;
      default:
        throw new Error('unreachable');
    }
    return { icon, label };
  });
</script>

<Button
  href={resolve(`/dashboard/drafts/${draftId}/${variant}.csv`)}
  download="{lightFormat(requestedAt, 'yyyy-MM-dd')}_{draftId}_{variant}.csv"
  variant="outline"
  size="sm"
>
  <metadata.icon class="size-4" />
  <span>{metadata.label}</span>
</Button>
