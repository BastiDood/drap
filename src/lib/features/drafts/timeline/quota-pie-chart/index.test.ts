import { describe, expect, test } from 'vitest';

import type { DraftLabQuotaSnapshot } from '$lib/features/drafts/types';

function calculatePercentage(snapshots: DraftLabQuotaSnapshot[], mode: 'initial' | 'lottery') {
  const totalQuota = snapshots.reduce(
    (sum, s) => sum + (mode === 'initial' ? s.initialQuota : s.lotteryQuota),
    0,
  );
  return snapshots
    .filter(s => (mode === 'initial' ? s.initialQuota : s.lotteryQuota) > 0)
    .map(snapshot => {
      const quota = mode === 'initial' ? snapshot.initialQuota : snapshot.lotteryQuota;
      return totalQuota > 0 ? Math.round((quota / totalQuota) * 100) : 0;
    });
}

describe('QuotaPieChart - percentage calculation', () => {
  test('calculates correct percentages for multiple labs', () => {
    const snapshots: DraftLabQuotaSnapshot[] = [
      { labId: 'csl', labName: 'CSL', initialQuota: 5, lotteryQuota: 0 },
      { labId: 'ndsl', labName: 'NDSL', initialQuota: 10, lotteryQuota: 0 },
      { labId: 'acl', labName: 'ACL', initialQuota: 15, lotteryQuota: 0 },
    ];

    const percentages = calculatePercentage(snapshots, 'initial');
    expect(percentages).toEqual([17, 33, 50]); // 5/30, 10/30, 15/30
  });

  test('calculates correct percentages for lottery mode', () => {
    const snapshots: DraftLabQuotaSnapshot[] = [
      { labId: 'csl', labName: 'CSL', initialQuota: 0, lotteryQuota: 8 },
      { labId: 'ndsl', labName: 'NDSL', initialQuota: 0, lotteryQuota: 12 },
    ];

    const percentages = calculatePercentage(snapshots, 'lottery');
    expect(percentages).toEqual([40, 60]); // 8/20, 12/20
  });

  test('returns 0% when total quota is 0', () => {
    const snapshots: DraftLabQuotaSnapshot[] = [
      { labId: 'csl', labName: 'CSL', initialQuota: 0, lotteryQuota: 0 },
      { labId: 'ndsl', labName: 'NDSL', initialQuota: 0, lotteryQuota: 0 },
    ];

    const percentages = calculatePercentage(snapshots, 'initial');
    expect(percentages).toEqual([]); // All filtered out (quota is 0)
  });

  test('handles single lab correctly (100%)', () => {
    const snapshots: DraftLabQuotaSnapshot[] = [
      { labId: 'csl', labName: 'CSL', initialQuota: 10, lotteryQuota: 0 },
    ];

    const percentages = calculatePercentage(snapshots, 'initial');
    expect(percentages).toEqual([100]);
  });

  test('filters out labs with 0 quota', () => {
    const snapshots: DraftLabQuotaSnapshot[] = [
      { labId: 'csl', labName: 'CSL', initialQuota: 10, lotteryQuota: 0 },
      { labId: 'ndsl', labName: 'NDSL', initialQuota: 0, lotteryQuota: 0 },
      { labId: 'acl', labName: 'ACL', initialQuota: 5, lotteryQuota: 0 },
    ];

    const percentages = calculatePercentage(snapshots, 'initial');
    expect(percentages).toEqual([67, 33]); // 10/15, 5/15 (ndsl filtered out)
  });

  test('handles rounding correctly for edge cases', () => {
    const snapshots: DraftLabQuotaSnapshot[] = [
      { labId: 'csl', labName: 'CSL', initialQuota: 1, lotteryQuota: 0 },
      { labId: 'ndsl', labName: 'NDSL', initialQuota: 2, lotteryQuota: 0 },
      { labId: 'acl', labName: 'ACL', initialQuota: 3, lotteryQuota: 0 },
    ];

    const percentages = calculatePercentage(snapshots, 'initial');
    // 1/6=16.67%, 2/6=33.33%, 3/6=50%
    expect(percentages).toEqual([17, 33, 50]);
  });
});
