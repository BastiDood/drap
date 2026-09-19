import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';
import { sum } from 'd3-array';

export type QuotaPieChartMode = 'initial' | 'lottery';

interface QuotaPieChartDatum {
  key: string;
  label: string;
  labName: string;
  value: number;
}

export function getQuota(snapshot: DraftLabQuotaSnapshot, mode: QuotaPieChartMode) {
  switch (mode) {
    case 'initial':
      return snapshot.initialQuota;
    case 'lottery':
      return snapshot.lotteryQuota;
    default:
      throw new Error('Unhandled quota mode');
  }
}

export function getTotalQuota(snapshots: DraftLabQuotaSnapshot[], mode: QuotaPieChartMode) {
  return sum(snapshots, snapshot => getQuota(snapshot, mode));
}

export function getQuotaPieChartData(snapshots: DraftLabQuotaSnapshot[], mode: QuotaPieChartMode) {
  return snapshots.reduce<QuotaPieChartDatum[]>((data, snapshot) => {
    const quota = getQuota(snapshot, mode);
    if (quota > 0) {
      const key = snapshot.labId.toUpperCase();
      data.push({
        key,
        label: key,
        labName: snapshot.labName,
        value: quota,
      });
    }
    return data;
  }, []);
}
